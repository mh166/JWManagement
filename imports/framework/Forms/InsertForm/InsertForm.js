import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { TAPi18n } from 'meteor/tap:i18n'
import { FlowRouter } from 'meteor/kadira:flow-router'

import RouteManager from '/imports/framework/Managers/RouteManager'
import { getKey, getTitle, getEntityTranslation } from '/imports/framework/Helpers/Helpers'
import { hasError, getErrorClass, getEntityErrorTranslation } from '/imports/framework/Helpers/Error'

import './InsertForm.jade'
import './InsertForm.scss'

import './Checkbox/InsertForm.Checkbox'
import './Date/InsertForm.Date'
import './Dropdown/InsertForm.Dropdown'
import './Link/InsertForm.Link'
import './Password/InsertForm.Password'
import './Picker/InsertForm.Picker'
import './Text/InsertForm.Text'
import './Textbox/InsertForm.Textbox'

Template.InsertForm.helpers({
  getKey,
  getEntityTranslation,
  getTitle,
  hasError,
  getErrorClass,
  getEntityErrorTranslation,
  getBackLink () {
    return FlowRouter.path(Template.instance().backLink.get(), FlowRouter.current().params)
  },
  getSearchTranslation () {
    if (FlowRouter.getParam('key') != null) {
      const key = FlowRouter.getParam('key').replace(/_/g, '.') + 'Values'

      let routeNameParts = FlowRouter.getRouteName().split('.')
      routeNameParts.pop()
      routeNameParts.splice(1, 0, 'entity')

      let attributeParts = [key]
      attributeParts.push('placeholder')

      return TAPi18n.__(routeNameParts.concat(attributeParts).join('.'))
    }
  },
  isSearchEnabled () {
    const template = Template.instance()
    const activeFieldKey = template.activeField.get()

    if (activeFieldKey != null) {
      const activeField = template.fields.filter((field) => {
        return field.key === activeFieldKey
      })[0]

      return activeField.search === true
    }
    return false
  },
  getFields () {
    return Template.instance().fields
  },
  activeField () {
    const template = Template.instance()

    for (let field of template.fields) {
      if (field.key === template.activeField.get()) {
        return field
      }
    }
    return {}
  },
  isPicker (field) {
    return field.type === 'picker'
  },
  isDate (field) {
    return field.type === 'date'
  },
  isDropdown (field) {
    return field.type === 'dropdown'
  },
  isCheckbox (field) {
    return field.type === 'checkbox'
  },
  isTextbox (field) {
    return field.type === 'textbox'
  },
  isPassword (field) {
    return field.type === 'password'
  },
  getInputData () {
    const template = Template.instance()
    const currentData = Template.currentData()
    const errors = template.errors.get()
    let inputData = {
      key: currentData.key,
      parentInstance: template
    }

    errors.some((error) => {
      if (error.name === inputData.key) {
        inputData.error = error.type
        return true
      }
    })

    if (template.entity[inputData.key] != null &&
      template.entity[inputData.key] !== '') {
      inputData.value = template.entity[inputData.key]
    }

    template.fields.some((field) => {
      if (field.key === inputData.key) {
        if ('default' in field) {
          inputData.defaultValue = field.default
        }
        if ('allowedValues' in field) {
          inputData.allowedValues = field.allowedValues
        }
        if ('allowedKeyValues' in field) {
          inputData.allowedKeyValues = field.allowedKeyValues
        }
        if ('allowedKeyValuesMethod' in field) {
          inputData.allowedKeyValuesMethod = field.allowedKeyValuesMethod
        }
        if ('required' in field) {
          inputData.required = field.required
        }
        if (field.type === 'date') {
          inputData.format = field.format
        }
        if (template.entity[field.key] != null) {
          inputData.value = template.entity[field.key]
        } else if (field.defaultValue != null) {
          inputData.value = field.defaultValue
        }
        return true
      }
    })

    return inputData
  },
  isSaving () {
    return Template.instance().isSaving.get()
  },
  isRequired () {
    const data = Template.currentData().data
    if (data.required != null) {
      return data.required
    }
    return false
  }
})

Template.InsertForm.onCreated(() => {
  const template = Template.instance()
  const data = Template.currentData().data

  template.fields = data.fields
  template.backLink = new ReactiveVar(data.backLink)
  template.entityKey = new ReactiveVar(data.entityKey)
  template.entity = {}
  template.errors = new ReactiveVar([])
  template.isSaving = new ReactiveVar(false)
  template.activeField = new ReactiveVar(null)
  template.searchText = new ReactiveVar('')

  template.setFieldValue = function (key, value) {
    const errors = this.errors.get()
    let newErrors = []

    template.entity[key] = value

    for (let error of errors) {
      if (error.name !== key) {
        newErrors.push(error)
      }
    }

    this.errors.set(newErrors)
  }
})

Template.InsertForm.onRendered(() => {
  window.scrollTo(0, 0)
})

Template.InsertForm.events({
  'click .navbar-back': function (e) {
    const template = Template.instance()
    if (template.activeField.get() != null) {
      e.preventDefault()
      e.stopPropagation()

      template.activeField.set(null)
    }
  },
  'keyup #search': () => {
    const template = Template.instance()
    const value = $('#search').val()
    template.searchText.set(value)
  },
  'change input': function () {
    const template = Template.instance()
    const key = this.data.key
    const errors = template.errors.get()
    let newErrors = []

    for (let error in errors) {
      if (error.name !== key) {
        newErrors.push(error)
      }
    }
    template.errors.set(newErrors)
  },
  'click .navbar-save': (e) => {
    e.preventDefault()

    const template = Template.instance()

    template.isSaving.set(true)

    Meteor.call(FlowRouter.getRouteName(), FlowRouter.current().params, template.entity, (error, entityId) => {
      template.isSaving.set(false)

      if (error != null) {
        if (error.error.error === 'validation-error') {
          let errors = []

          if (error.error.reason != null && typeof e.error.reason === 'object') {
            errors = errors.concat(e.error.reason)
          } else if (error.error.details != null) {
            errors = errors.concat(error.error.details)
          }

          template.errors.set(errors.map((error) => {
            let parts = error.name.split('.')

            if (!isNaN(parseInt(parts[parts.length - 1], 10))) {
              parts.pop()
            }

            error.name = parts.join('_')

            if (error.name.search(/[0-9]/g) > -1) {
              error.name = error.name.substring(getRegexLastIndexOf(error.name, /[0-9]/g) + 2)
            }

            return error
          }))
        } else {
          alert('SERVER ERROR')
        }
      } else {
        const entityKey = template.entityKey.get()

        RouteManager.navigateToDetails(entityKey, entityId, true)
      }
    })
  }
})

function getRegexLastIndexOf (string, regex) {
  regex = (regex.global)
    ? regex
    : new RegExp(regex.source, 'g' + (regex.ignoreCase ? 'i' : '') + (regex.multiLine ? 'm' : ''))

  let startpos = string.length
  let stringToWorkWith = string.substring(0, startpos + 1)
  let lastIndexOf = -1
  let nextStop = 0
  let result

  while ((result = regex.exec(stringToWorkWith)) != null) {
    lastIndexOf = result.index
    regex.lastIndex = ++nextStop
  }

  return lastIndexOf
}
