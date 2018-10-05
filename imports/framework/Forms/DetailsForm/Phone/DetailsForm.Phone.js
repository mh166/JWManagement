import { Template } from 'meteor/templating'

import { getValue } from '/imports/framework/Forms/DetailsForm/DetailsForm.Helpers'
import { getEntityTranslation } from '/imports/framework/Helpers/Helpers'

import './DetailsForm.Phone.jade'

Template.DetailsFormPhone.helpers({ getValue, getEntityTranslation })

Template.DetailsFormPhone.onCreated(() => {})

Template.DetailsFormPhone.onRendered(() => {})

Template.DetailsFormPhone.onDestroyed(() => {})

Template.DetailsFormPhone.events({})
