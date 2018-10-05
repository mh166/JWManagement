moment = require('moment')

Meteor.methods

	request: (shiftId, teamId) ->
		user = Meteor.user()
		userId = user._id
		shift = Shifts.findOne shiftId, fields: teams: 1, scheduling: 1, tagId: 1

		if Meteor.isClient
			Meteor.subscribe 'userStatistics', Meteor.userId(), shiftId

		if Meteor.isServer
			check { shiftId: shiftId, teamId: teamId }, isExistingShiftAndTeam
			check { tagId: shift.tagId, userId: userId }, isTagParticipant

		user =
			_id: userId
			name: user.profile.firstname + ' ' + user.profile.lastname
			teamleader: Roles.userIsInRole userId, 'teamleader', shift.tagId
			substituteTeamleader: Roles.userIsInRole userId, 'substituteTeamleader', shift.tagId
			thisTeamleader: false
			phone: user.profile.telefon
			email: user.profile.email

		if shift.scheduling == 'manual'
			for team in shift.teams when team._id == teamId
				if team.status == 'open'
					Shifts.update _id: shiftId, 'teams._id': teamId,
						$pull: 'teams.$.declined': _id: userId
						$addToSet: 'teams.$.pending': user

					# TODO: write mail to orga team if participants.length > 0
				else
					throw new Meteor.Error 500, TAPi18n.__('modal.shift.closedTeam')
		else if shift.scheduling == 'direct'
			for team in shift.teams when team._id == teamId
				inPending = false

				for participant in team.pending when participant._id == userId
					inPending = true

				if !inPending
					if team.participants.length > 0
						if team.participants.length < team.max
							Shifts.update _id: shiftId, 'teams._id': teamId,
								$pull: 'teams.$.declined': _id: userId
								$addToSet: 'teams.$.participants': user

							if team.participants.length == team.max - 1
								Meteor.call 'closeTeam', shiftId, teamId

							Meteor.call 'sendTeamUpdate', shiftId, teamId, 'participant'
						else throw new Meteor.Error 500, TAPi18n.__('modal.shift.maximumReached')
					else if team.pending.length >= team.min - 1

						teamleader = team.pending.find((user) => user.teamleader) || team.pending.find((user) => user.substituteTeamleader)

						approvedUsers = [ ]
						declinedUsers = [ ]

						if teamleader?
							approvedUsers.push userId

							Shifts.update _id: shiftId, 'teams._id': teamId,
								$pull: 'teams.$.declined': _id: userId
								$addToSet: 'teams.$.participants': user

							for pendingUser in team.pending
								if approvedUsers.length < team.max
									approvedUsers.push pendingUser._id

									Shifts.update _id: shiftId, 'teams._id': teamId,
										$pull: 'teams.$.pending': _id: pendingUser._id

									Shifts.update _id: shiftId, 'teams._id': teamId,
										$pull: 'teams.$.declined': _id: pendingUser._id
										$addToSet: 'teams.$.participants': pendingUser
								else
									declinedUsers.push pendingUser._id

									Shifts.update _id: shiftId, 'teams._id': teamId,
										$pull: 'teams.$.pending': _id: pendingUser._id
										$addToSet: 'teams.$.declined': pendingUser

								if pendingUser.checked
									pendingUser.checked = false

							for otherTeam in shift.teams when otherTeam._id != teamId
								for pendingUser in otherTeam.pending when pendingUser._id in approvedUsers
									if pendingUser.checked
										pendingUser.checked = false

									Shifts.update _id: shiftId, 'teams._id': otherTeam._id,
										$pull: 'teams.$.pending': _id: pendingUser._id
										$addToSet: 'teams.$.declined': pendingUser

								for participant in otherTeam.participants when participant._id in approvedUsers
									Meteor.call 'declineParticipant', shiftId, otherTeam._id, participant._id

							Meteor.call 'setLeader', shiftId, team._id, teamleader._id

							for approvedUser in approvedUsers
								Meteor.call 'sendConfirmation', shiftId, teamId, approvedUser
							for declinedUser in declinedUsers
								Meteor.call 'sendDeclined', shiftId, teamId, declinedUser

							if approvedUsers.length == team.max
								Meteor.call 'closeTeam', shiftId, teamId
						else
							Shifts.update _id: shiftId, 'teams._id': teamId,
								$pull: 'teams.$.declined': _id: userId
								$addToSet: 'teams.$.pending': user
					else
						Shifts.update _id: shiftId, 'teams._id': teamId,
							$pull: 'teams.$.declined': _id: userId
							$addToSet: 'teams.$.pending': user

	cancelRequest: (shiftId, teamId) ->
		shift = Shifts.findOne shiftId, fields: teams: 1

		if Meteor.isServer
			check { shiftId: shiftId, teamId: teamId }, isExistingShiftAndTeam

		Shifts.update _id: shiftId, 'teams._id': teamId,
			$pull: 'teams.$.pending': _id: Meteor.userId()

	cancelParticipation: (shiftId, teamId) ->
		user = Meteor.user()
		userId = Meteor.userId()
		shift = Shifts.findOne shiftId, fields: teams: 1, scheduling: 1, tagId: 1, date: 1, projectId: 1

		if Meteor.isServer
			check { shiftId: shiftId, teamId: teamId }, isExistingShiftAndTeam
			check { tagId: shift.tagId, userId: userId }, isTagParticipant

		for team in shift.teams when team._id == teamId
			if team.participants.length == team.min
				cancelledUser = {}
				for participant in team.participants when participant._id == userId
					cancelledUser = participant

				Shifts.update _id: shiftId, 'teams._id': teamId,
					$pull: 'teams.$.participants': _id: userId
					$addToSet: 'teams.$.pending': cancelledUser

				firstDay = moment().startOf('isoWeek')
				lastDay = moment().endOf('isoWeek')
				isThisWeek = moment(shift.date, 'YYYYDDDD').isBetween(firstDay, lastDay, null, '[]')

				if shift.scheduling == 'manual' && isThisWeek
					Meteor.call 'sendUnderstaffed', shiftId, teamId
				#else if shift.scheduling == 'manual'
				#	Meteor.call 'sendToOrga', shift.projectId, 'teamCancel', shiftId, teamId

				Meteor.call 'cancelTeam', shiftId, teamId, 'missingParticipant'
			else
				wasTeamleader = false
				hasTeamleader = false
				participantData = {}
				newTeamleaderData = {}

				for participant in team.participants
					if participant._id == userId
						participantData = participant

						if participant.thisTeamleader
							wasTeamleader = true
					else if participant.teamleader || participant.substituteTeamleader
						hasTeamleader = true
						newTeamleaderData = participant
						newTeamleaderData.thisTeamleader = true

				if wasTeamleader
					if hasTeamleader
						Shifts.update _id: shiftId, 'teams._id': teamId,
							$pull: 'teams.$.participants': _id: userId
							$addToSet: 'teams.$.declined': participantData

						Shifts.update _id: shiftId, 'teams._id': teamId,
							$pull: 'teams.$.participants': _id: newTeamleaderData._id

						Shifts.update _id: shiftId, 'teams._id': teamId,
							$addToSet: 'teams.$.participants': newTeamleaderData

						Meteor.call 'sendTeamUpdate', shiftId, teamId, 'leader'

						Meteor.call 'openTeam', shiftId, teamId
					else
						Meteor.call 'cancelTeam', shiftId, teamId, 'missingParticipant'
				else
					Shifts.update _id: shiftId, 'teams._id': teamId,
						$pull: 'teams.$.participants': _id: userId
						$addToSet: 'teams.$.declined': participantData

					Meteor.call 'sendTeamUpdate', shiftId, teamId, 'participant'

					Meteor.call 'openTeam', shiftId, teamId
