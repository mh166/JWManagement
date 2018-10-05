import moment from 'moment'

const PROJECT_OPTIONS = {
  fields: {
    name: 1,
    news: 1,
    tags: 1,
    vesselModule: 1
  },
  sort: {
    name: 1,
    _id: 1
  }
}

const SHIFT_OPTIONS = {
  fields: {
    projectId: 1,
    tagId: 1,
    date: 1,
    start: 1,
    end: 1,
    teams: 1
  },
  sort: {
    date: 1,
    start: 1,
    end: 1,
    tagId: 1
  }
}

function getProjects (projectIds) {
  return Projects.find({
    _id: {
      $in: projectIds
    }
  }, PROJECT_OPTIONS)
    .fetch()
    .map((project) => {
      project.project = project.name
      return project
    })
}

function getUpdatedShifts (projects, shifts) {
  return shifts.map((shift) => {
    const project = projects.filter((p) => {
      return p._id === shift.projectId
    })[0]

    if (project) {
      const tag = project.tags.filter((t) => {
        return t._id === shift.tagId
      })[0]

      if (project != null && tag != null) {
        shift.tag = tag.name
        shift.date = parseInt(moment(shift.date, 'YYYYDDD').format('YYYYMMDD'), 10)

        return shift
      }

      return null
    }

    return null
  })
    .filter((shift) => {
      return shift != null
    })
}

function getMissingShiftReports (projectIds, projects, date, userId) {
  const shifts = Shifts.find({
    projectId: {
      $in: projectIds
    },
    date: {
      $lt: date
    },
    'teams.participants': {
      $elemMatch: {
        _id: userId,
        thisTeamleader: true
      }
    }
  }, SHIFT_OPTIONS)
    .fetch()
    .filter((shift) => {
    // only return shift if my team hasn't submitted the report yet
      return shift.teams.filter((team) => {
        return team.report == null || !team.report.submitted
      }).length > 0
    })

  return getUpdatedShifts(projects, shifts)
}

function getUpcomingShifts (projectIds, projects, date, userId) {
  const shifts = Shifts.find({
    projectId: {
      $in: projectIds
    },
    date: {
      $gte: date
    },
    'teams.participants._id': userId
  }, SHIFT_OPTIONS)
    .fetch()

  return getUpdatedShifts(projects, shifts)
}

function getPendingRequests (projectIds, projects, date, userId) {
  const shifts = Shifts.find({
    projectId: {
      $in: projectIds
    },
    date: {
      $gte: date
    },
    'teams.pending._id': userId
  }, SHIFT_OPTIONS)
    .fetch()

  return getUpdatedShifts(projects, shifts)
}

function getOlderShifts (projectIds, projects, date, userId) {
  const shifts = Shifts.find({
    projectId: {
      $in: projectIds
    },
    date: {
      $lt: date
    },
    'teams.participants._id': userId
  }, SHIFT_OPTIONS)
    .fetch()

  return getUpdatedShifts(projects, shifts)
}

function getCleanedProjects (projects) {
  return projects.map((project) => {
    delete project.name
    delete project.tags
    return project
  })
}

function getCleanedShifts (shifts) {
  return shifts.map((shift) => {
    delete shift.tagId
    delete shift.teams
    return shift
  })
}

export {
  getProjects,
  getMissingShiftReports,
  getUpcomingShifts,
  getPendingRequests,
  getOlderShifts,
  getCleanedProjects,
  getCleanedShifts
}
