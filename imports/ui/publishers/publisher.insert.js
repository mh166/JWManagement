import { Template } from 'meteor/templating'

import Gender from '/imports/framework/Constants/Gender'
import Pioneer from '/imports/framework/Constants/Pioneer'
import Privilege from '/imports/framework/Constants/Privilege'

Template['publisher.insert'].helpers({
  data: {
    backLink: 'publisher.search',
    entityKey: 'userId',
    fields: [{
      key: 'profile_firstname',
      required: true
    }, {
      key: 'profile_lastname',
      required: true
    }, {
      key: 'profile_email',
      required: true
    }, {
      key: 'profile_telefon'
    }, {
      key: 'username'
    }, {
      key: 'profile_gender',
      type: 'picker',
      allowedValues: Gender.allowedValues,
      defaultValue: Gender.defaultValue,
      required: true
    }, {
      key: 'profile_pioneer',
      type: 'picker',
      allowedValues: Pioneer.allowedValues,
      defaultValue: Pioneer.defaultValue,
      required: true
    }, {
      key: 'profile_privilege',
      type: 'picker',
      allowedValues: Privilege.allowedValues,
      defaultValue: Privilege.defaultValue,
      required: true
    }, {
      key: 'profile_languages'
    }]
  }
})
