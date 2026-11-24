/* Keep slide navigation locked until every question has been submitted. */
(function () {
  var proto = H5P.CoursePresentation.prototype;
  var attach = proto.attachElement;
  var showPopup = proto.showPopup;
  proto.showPopup = function (options) {
    var cp = this;
    if (options.instance && options.remove) {
      var remove = options.remove;
      options.remove = function () {
        var result = remove.apply(this, arguments);
        var source = cp.currentSlideIndex;
        var state = cp.generatorSlideCompletion && cp.generatorSlideCompletion.get(cp.slides[source]);
        if (state && state.pendingTarget !== undefined && state.required.every(function (question) { return state.answered.has(question); })) {
          var target = state.pendingTarget;
          delete state.pendingTarget;
          if (cp.currentSlideIndex === source) cp.jumpToSlide(target);
        }
        return result;
      };
    }
    return showPopup.apply(this, arguments);
  };
  var questionLibraries = ['H5P.MultiChoice', 'H5P.SingleChoiceSet', 'H5P.TrueFalse', 'H5P.Blanks', 'H5P.DragQuestion', 'H5P.DragText', 'H5P.MarkTheWords', 'H5P.MultiMediaChoice', 'H5P.Summary'];
  function isQuestion(element) {
    return element.action && questionLibraries.indexOf(element.action.library.split(' ')[0]) !== -1;
  }
  proto.attachElement = function (element, instance, slide) {
    var wrapper = attach.apply(this, arguments);
    if (this.editor || this.presentation.generatorRequireQuestionsBeforeNavigation === false) return wrapper;
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
          var wasComplete = state.required.every(function (question) { return state.answered.has(question); });
          state.answered.add(element);
          refresh();
          if (!wasComplete && state.required.length && state.required.every(function (question) { return state.answered.has(question); })) {
            var targets;
            try { targets = JSON.parse(cp.presentation.generatorAutoAdvance || '[]'); } catch (_) { targets = []; }
            var source = cp.slides.indexOf(config), target = targets[source];
            if (cp.currentSlideIndex === source && Number.isInteger(target) && target >= 0 && target < cp.slides.length && target !== source) {
              if (element.displayAsButton) state.pendingTarget = target;
              else setTimeout(function () { if (cp.currentSlideIndex === source) cp.jumpToSlide(target); }, 0);
            }
          }
        }
      });
      if (typeof instance.resetTask === 'function') {
        var reset = instance.resetTask;
        instance.resetTask = function () {
          var result = reset.apply(this, arguments);
          state.answered.delete(element);
          delete state.pendingTarget;
          refresh();
          return result;
        };
      }
    }
    return wrapper;
  };
})();
