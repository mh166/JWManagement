import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { Roles } from 'meteor/alanning:roles'
import { TAPi18n } from 'meteor/tap:i18n'
import Vessels from '/imports/api/vessels/Vessels'
import Languages from '/imports/framework/Constants/Languages'
import Permissions from '/imports/framework/Constants/Permissions'

Meteor.methods({
  'vessel.search': ({ projectId, searchString, limit }) => {
    checkVesselModule(projectId)

    const result = {
      total: 0,
      items: []
    }

    if (typeof searchString !== 'string' || searchString === '') {
      return result
    }

    const regEx = new RegExp(searchString, 'i')

    const cursor = Vessels.find({
      $or: [
        { _id: searchString },
        { name: regEx },
        { callsign: regEx },
        { eni: regEx },
        { imo: regEx },
        { mmsi: regEx }
      ]
    }, {
      fields: {
        'name': 1,
        'flag': 1,
        'type': 1,
        'callsign': 1,
        'eni': 1,
        'imo': 1,
        'mmsi': 1
      },
      sort: {
        name: 1
      },
      limit: limit
    })

    result.total = cursor.count()
    result.items = cursor.fetch()

    return result
  },
  'vessel.get': ({ projectId, vesselId }) => {
    checkVesselModule(projectId)

    return getExtendedVessel(vesselId)
  },
  'vessel.getField': ({ projectId, vesselId, key }) => {
    checkVesselModule(projectId)

    return getExtendedVessel(vesselId)[key]
  },
  'vessel.insert': ({ projectId }, vessel) => {
    checkVesselModule(projectId)

    try {
      Vessels.persistence.insert(vessel)
      return vessel._id
    } catch (e) {
      throw new Meteor.Error(e)
    }
  },
  'vessel.update': ({ projectId, vesselId }, key, value) => {
    checkVesselModule(projectId)

    try {
      Vessels.persistence.update(vesselId, key, value)
    } catch (e) {
      throw new Meteor.Error(e)
    }
  },
  'vessel.visit.insert': ({ projectId, vesselId }, visit) => {
    checkVesselModule(projectId)

    let visits = Vessels.findOne(vesselId).visits

    if (visits == null) {
      visits = []
    }

    visit._id = Random.id()
    visit.projectId = projectId
    delete visit.userId
    visits.push(visit)

    try {
      Vessels.persistence.update(vesselId, 'visits', visits)
      return visit._id
    } catch (e) {
      throw new Meteor.Error(e)
    }
  },
  'vessel.visit.getAvailableHarbors': ({ projectId }) => {
    checkVesselModule(projectId)

    const project = Projects.findOne(projectId, { fields: { harbors: 1 } })

    return project.harbors
      .map(({ _id, name }) => {
        return { key: _id, value: name }
      })
      .sort((a, b) => {
        if (a.key < b.key) { return -1 }
        if (a.key > b.key) { return 1 }
        return 0
      })
  },
  'vessel.visit.getLast': ({ projectId, vesselId }) => {
    checkVesselModule(projectId)

    return getExtendedVessel(vesselId).visits.pop()
  },
  'vessel.visit.getField': ({ projectId, vesselId, key }) => {
    checkVesselModule(projectId)

    return getExtendedVessel(vesselId).visits.pop()[key]
  },
  'vessel.visit.update': ({ projectId, vesselId, visitId }, key, value) => {
    checkVesselModule(projectId)

    const extendedVisits = getExtendedVessel(vesselId).visits

    // only author can update visit
    if (extendedVisits.length === 0 || extendedVisits[0].createdBy !== Meteor.userId()) {
      return
    }

    // only last visit can be updated
    if (visitId !== extendedVisits[0]._id) {
      return
    }

    const visits = Vessels.findOne(vesselId).visits.map((visit) => {
      if (visit._id === visitId) {
        visit[key] = value
      }
      return visit
    })

    try {
      Vessels.persistence.update(vesselId, 'visits', visits)
    } catch (e) {
      throw new Meteor.Error(e)
    }
  },
  'vessel.visit.delete': ({ projectId, vesselId, visitId }) => {
    checkVesselModule(projectId)

    const extendedVisits = getExtendedVessel(vesselId).visits

    // only author can delete visit
    if (extendedVisits.length === 0 || extendedVisits[0].createdBy !== Meteor.userId()) {
      return
    }

    // only last visit can be deleted
    if (visitId !== extendedVisits[0]._id) {
      return
    }

    const visits = Vessels.findOne(vesselId).visits.filter((visit) => visit._id !== visitId)

    try {
      Vessels.persistence.update(vesselId, 'visits', visits)
    } catch (e) {
      throw new Meteor.Error(e)
    }
  },
  'vessel.visit.language.insert': ({ projectId, vesselId, visitId }, { languageIds }) => {
    checkVesselModule(projectId)

    const extendedVisits = getExtendedVessel(vesselId).visits

    // only author can update visit
    if (extendedVisits.length === 0 || extendedVisits[0].createdBy !== Meteor.userId()) {
      return
    }

    // only last visit can be updated
    if (visitId !== extendedVisits[0]._id) {
      return
    }

    const visits = Vessels.findOne(vesselId).visits.map((visit) => {
      if (visit.languageIds == null) {
        visit.languageIds = []
      }
      if (visit._id === visitId && visit.languageIds.filter((x) => x === languageIds).length === 0) {
        visit.languageIds.push(languageIds)
      }
      return visit
    })

    try {
      Vessels.persistence.update(vesselId, 'visits', visits)
    } catch (e) {
      throw new Meteor.Error(e)
    }
  },
  'vessel.visit.language.delete': ({ projectId, vesselId, visitId }, languageId) => {
    checkVesselModule(projectId)

    const extendedVisits = getExtendedVessel(vesselId).visits

    // only author can update visit
    if (extendedVisits.length === 0 || extendedVisits[0].createdBy !== Meteor.userId()) {
      return
    }

    // only last visit can be updated
    if (visitId !== extendedVisits[0]._id) {
      return
    }

    const visits = Vessels.findOne(vesselId).visits.map((visit) => {
      if (visit._id === visitId) {
        visit.languageIds = visit.languageIds.filter((langId) => langId !== languageId)
      }
      return visit
    })

    try {
      Vessels.persistence.update(vesselId, 'visits', visits)
    } catch (e) {
      throw new Meteor.Error(e)
    }
  }
})

function getExtendedVisit (visit) {
  visit.person = 'Not visible'
  visit.email = ''
  visit.phone = ''

  if (visit.isUserVisible) {
    const author = Meteor.users.findOne(visit.createdBy, {
      fields: {
        'profile.firstname': 1,
        'profile.lastname': 1,
        'profile.telefon': 1,
        'profile.email': 1
      }
    })

    if (author) {
      visit.person = author.profile.firstname + ' ' + author.profile.lastname
      visit.email = author.profile.email
      visit.phone = author.profile.telefon
    }
  }

  const project = Projects.findOne(visit.projectId, {
    fields: {
      country: 1,
      harbors: 1
    }
  })

  visit.country = project.country

  const harbor = project.harbors.filter((h) => h._id === visit.harborId)[0]

  visit.harbor = harbor.name

  if (visit.languageIds == null) {
    visit.languageIds = []
  } else {
    visit.languageIds = visit.languageIds.map((languageId) => {
      return {
        _id: languageId
      }
    })
  }

  const interfaceLanguage = Meteor.user().profile.language

  visit.languages = visit.languageIds
    .filter((language) => Languages.allowedValues.includes(language._id))
    .map((language) => TAPi18n.__('language._' + language._id, {}, interfaceLanguage))
    .join(', ')

  return visit
}

function getExtendedVessel (vesselId) {
  let vessel = Vessels.findOne(vesselId)

  if (vessel) {
    if ('visits' in vessel) {
      if (vessel.visits.length > 1) {
        vessel.visits.sort((a, b) => a.createdAt - b.createdAt)
        vessel.visits = [vessel.visits.pop()]
      }

      if (vessel.visits.length > 0) {
        vessel.visits[0] = getExtendedVisit(vessel.visits[0])
      }
    } else {
      vessel.visits = []
    }
  }

  return vessel
}

function checkVesselModule (projectId) {
  const project = Projects.findOne(projectId, { fields: { vesselModule: 1 } })

  if (project == null || project.vesselModule !== true) {
    throw new Meteor.Error('projectNotFound')
  }

  if (!Roles.userIsInRole(Meteor.userId(), Permissions.member, projectId)) {
    throw new Meteor.Error('userNotProjectMember')
  }
}
