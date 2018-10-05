import { Template } from 'meteor/templating'

Template['vessel.search'].helpers({
  data: {
    entityId: 'vesselId',
    backLink: 'project.details',
    allowCreate: true,
    columns: [{
      name: '_id',
      visible: false
    }, {
      name: 'name',
      mobile: true
    }, {
      name: 'flag',
      mobile: true
    }, {
      name: 'type',
      type: 'dropdown',
      mobile: true
    }, {
      name: 'callsign',
      mobile: true
    }, {
      name: 'eni'
    }, {
      name: 'imo'
    }, {
      name: 'mmsi'
    }],
    searchCriteria: (search) => {
      return {
        selector: {
          $or: [{
            _id: search
          }, {
            name: search
          }, {
            callsign: search
          }, {
            eni: search
          }, {
            imo: search
          }, {
            mmsi: search
          }]
        },
        options: {
          sort: {
            name: 1,
            callsign: 1
          }
        }
      }
    }
  }
})
