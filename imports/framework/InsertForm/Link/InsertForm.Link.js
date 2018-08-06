import { Template } from 'meteor/templating';

import { getKey, getTitle, getEntityTranslation } from '/imports/framework/Helpers';
import { hasError, getErrorClass, getEntityErrorTranslation } from '/imports/framework/Helpers.Error';

import './InsertForm.Link.jade';

Template.InsertFormLink.helpers({
  getKey,
  getEntityTranslation,
  getTitle,
  hasError,
  getErrorClass,
  getEntityErrorTranslation,
  getValue() {
    const template = Template.instance();

    if (template.displayValue != null) {
      return template.displayValue;
    } else {
      let value = 'placeholder';
      const data = Template.currentData().data;

      if (data.value != null) {
        value = data.value;
      }

      let messagePathParts = FlowRouter.getRouteName().split('.');
      messagePathParts.pop();
      messagePathParts.splice(1, 0, 'entity');
      messagePathParts = messagePathParts.concat(data.key.replace(/_/g, '.'));

      return TAPi18n.__(messagePathParts.join('.') + 'Values.' + value);
    }
  }
});

Template.InsertFormLink.onCreated(() => {
  const template = Template.instance();
  const data = Template.currentData().data;

  template.key = data.key;
  template.insertForm = data.parentInstance;

  if (data.allowedKeyValues != null && data.value != null) {
    template.displayValue = data.allowedKeyValues.filter((keyValue) => {
      return keyValue.key == data.value;
    })[0].value;
  }
});

Template.InsertFormLink.onRendered(() => {});

Template.InsertFormLink.onDestroyed(() => {});

Template.InsertFormLink.events({
  'click .link': (e, template) => {
    template.insertForm.activeField.set(template.key);
  }
});