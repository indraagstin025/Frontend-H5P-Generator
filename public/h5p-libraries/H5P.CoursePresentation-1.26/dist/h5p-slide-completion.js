/* Keep slide navigation locked until every question has been submitted. */
(function () {
  var proto = H5P.CoursePresentation.prototype;
  var attach = proto.attachElement;
  var questionLibraries = ['H5P.MultiChoice', 'H5P.SingleChoiceSet', 'H5P.TrueFalse', 'H5P.Blanks', 'H5P.DragQuestion', 'H5P.DragText', 'H5P.MarkTheWords', 'H5P.MultiMediaChoice', 'H5P.Summary'];
  function isQuestion(element) {
    return element.action && questionLibraries.indexOf(element.action.library.split(' ')[0]) !== -1;
  }
  proto.attachElement = function (element, instance, slide) {
    var wrapper = attach.apply(this, arguments);
    if (this.editor) return wrapper;
    var cp = this;
    var config = cp.slides.find(function (entry) { return entry.elements.indexOf(element) !== -1; });
    if (!config) return wrapper;
    var states = cp.generatorSlideCompletion || (cp.generatorSlideCompletion = new Map());
    var state = states.get(config);
    if (!state) {
      state = { required: config.elements.filter(isQuestion), answered: new Set(), buttons: [] };
      states.set(config, state);
    }
    function refresh() {
      var unlocked = state.required.every(function (question) { return state.answered.has(question); });
      state.buttons.forEach(function (button) {
        button.css('display', unlocked ? '' : 'none');
        button.attr('aria-hidden', unlocked ? 'false' : 'true');
        if (button[0]) button[0].inert = !unlocked;
      });
    }
    if (element.goToSlideType !== undefined || element.goToSlide !== undefined) {
      state.buttons.push(wrapper);
      refresh();
    }
    if (isQuestion(element) && instance && typeof instance.on === 'function') {
      instance.on('xAPI', function (event) {
        var verb = typeof event.getVerb === 'function' ? event.getVerb() : '';
        if (verb === 'answered' || verb === 'completed') {
          state.answered.add(element);
          refresh();
        }
      });
      if (typeof instance.resetTask === 'function') {
        var reset = instance.resetTask;
        instance.resetTask = function () {
          var result = reset.apply(this, arguments);
          state.answered.delete(element);
          refresh();
          return result;
        };
      }
    }
    return wrapper;
  };
})();
