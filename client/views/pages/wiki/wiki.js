import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import { FlowRouter } from 'meteor/kadira:flow-router'

Template.wiki.helpers({
  tabs: function () {
    const project = Projects.findOne(FlowRouter.getParam('projectId'))
    return project != null ? project.wiki != null ? project.wiki.tabs : void 0 : void 0
  },
  files: function () {
    const projectId = FlowRouter.getParam('projectId')
    return Files.find({
      projectId: projectId
    })
  },
  isReady: function () {
    return ProjectSubs.ready()
  },
  faqArgs: function (tabId, faq, index) {
    return {
      faq,
      tabId,
      moveFaq: function (direction, tabId, faqId) {
        Meteor.call('moveFaq', direction === 'up' ? -1 : 1, FlowRouter.getParam('projectId'), tabId, faqId)
      }
    }
  }
})

Template.wiki.onRendered(function () {
  const projectId = FlowRouter.getParam('projectId')

  return this.autorun(function () {
    const handle = ProjectSubs.subscribe('wiki', projectId)

    handle.ready(Tracker.afterFlush(function () {
      $('.nav-tabs > li').removeClass('active')
      $('.nav-tabs > li:first').addClass('active')
      $('.tab-content .tab-pane:first').addClass('active')
      $('.summernote').summernote()
      return $('.note-editor').addClass('hidden')
    }))

    return FileSubs.subscribe('files', projectId)
  })
})

Template.wiki.events({
  'click .addTab': function () {
    const projectId = FlowRouter.getParam('projectId')
    return swalInput({
      swal: 'add.tab',
      doConfirm: function (inputValue) {
        return Meteor.call('addTab', projectId, inputValue)
      }
    })
  },
  'click .removeTab': function (e) {
    const tabId = this._id
    return swalYesNo({
      swal: 'delete.tab',
      type: 'warning',
      doConfirm: function () {
        return Meteor.call('removeTab', FlowRouter.getParam('projectId'), tabId, function () {
          $('.nav-tabs li').first().addClass('active')
          return $('.tab-content .tab-pane').first().addClass('active')
        })
      }
    })
  },
  'click .editTab': function (e) {
    const tabId = this._id
    $('#' + tabId + 'b .tab-title').addClass('hidden')
    $('#' + tabId + 'b .tab-edit').removeClass('hidden')
    return $('#' + tabId + 'b .changeTab').focus()
  },
  'blur .changeTab': function (e) {
    const tabId = this._id
    $('#' + tabId + 'b .tab-edit').addClass('hidden')
    return $('#' + tabId + 'b .tab-title').removeClass('hidden')
  },
  'change .changeTab': function (e) {
    var projectId, tabId
    projectId = FlowRouter.getParam('projectId')
    tabId = this._id
    return Meteor.call('changeTab', projectId, tabId, $(e.target).val())
  },
  'click .addQuestion': function (e) {
    const projectId = FlowRouter.getParam('projectId')
    const tabId = this._id
    return swalInput({
      swal: 'add.question',
      doConfirm: function (inputValue) {
        return Meteor.call('addQuestion', projectId, inputValue, tabId, function (err, faqId) {
          if (err) console.log(err)

          return Tracker.afterFlush(function () {
            $('#' + faqId).find('.summernote').summernote()
            return $('.note-editor').addClass('hidden')
          })
        })
      }
    })
  },
  'change #uploadFile': function (e) {
    if (e.target.files.length > 0) {
      let doc = new FS.File(e.target.files[0])
      doc.projectId = FlowRouter.getParam('projectId')
      return Files.insert(doc, handleError)
    }
  },
  'click .removeFile': function (e) {
    const projectId = FlowRouter.getParam('projectId')
    const fileId = this._id
    return swalYesNo({
      swal: 'delete.file',
      type: 'warning',
      doConfirm: function () {
        return Meteor.call('removeFile', fileId, projectId)
      }
    })
  },
  'click .editFile': function () {
    const projectId = FlowRouter.getParam('projectId')
    const fileId = this._id
    return swalInput({
      swal: 'update.file',
      doConfirm: function (inputValue) {
        return Meteor.call('changeFileName', fileId, projectId, inputValue)
      }
    })
  }
})
