angular.module('bgDirectives', [])
    .directive('bgSplitter', function($timeout) {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {
                splitterId: '@',
                orientation: '@',
                onChange: '&onChange'
            },
            template: '<div class="split-panes {{orientation}}" ng-transclude></div>',
            controller: function ($scope) {
                $scope.panes = [];

                this.addPane = function(pane){
                    if ($scope.panes.length > 1)
                        throw 'splitters can only have two panes';
                    $scope.panes.push(pane);
                    return $scope.panes.length;
                };

            },
            link: function(scope, element, attrs) {
                var handler = angular.element('<div class="split-handler"></div>');
                var pane1 = scope.panes[0];
                var pane2 = scope.panes[1];
                var vertical = scope.orientation == 'vertical';
                var pane1Min = pane1.minSize || 0;
                var pane2Min = pane2.minSize || 0;
                var drag = false;
                var lastPos = null;

                pane1.elem.after(handler);

                var getSavedPosition = function() {
                    if(!!localStorage && !!scope.splitterId) {
                        var savedPos = localStorage.getItem(scope.splitterId);
                        var pos = parseInt(savedPos);
                        return isNaN(pos) ? null : pos;
                    }
                    return null;
                };

                var savePosition = function (pos) {
                    if(!!localStorage && !!scope.splitterId) {
                        localStorage.setItem(scope.splitterId, pos);
                    }
                };

                var setPosition = function(pos) {
                    var bounds = element[0].getBoundingClientRect();

                    if (vertical) {
                        var height = bounds.bottom - bounds.top;
                        if (pos < pane1Min) pos = pane1Min;
                        if (height - pos < pane2Min) pos = height - pane2Min;

                        handler.css('top', pos + 'px');
                        pane1.elem.css('height', pos + 'px');
                        pane2.elem.css('top', pos + 'px');

                    } else {
                        var width = bounds.right - bounds.left;
                        if (pos < pane1Min) pos = pane1Min;
                        if (width - pos < pane2Min) pos = width - pane2Min;

                        handler.css('left', pos + 'px');
                        pane1.elem.css('width', pos + 'px');
                        pane2.elem.css('left', pos + 'px');
                    }
                    lastPos = pos;
                    if(scope.onChange) {
                        $timeout(scope.onChange);
                    }
                };

                element.bind('mousemove', function (ev) {
                    if (!drag) return;

                    var bounds = element[0].getBoundingClientRect();
                    var pos = 0;

                    if (vertical) {
                        pos = ev.clientY - bounds.top;

                    } else {
                        pos = ev.clientX - bounds.left;
                    }

                    setPosition(pos);

                    if(scope.onChange) {
                        $timeout(scope.onChange);
                    }
                });

                handler.bind('mousedown', function (ev) {
                    ev.preventDefault();
                    drag = true;
                });

                angular.element(document).bind('mouseup', function (ev) {
                    savePosition(lastPos);
                    drag = false;
                });

                $timeout(function() {
                    lastPos = getSavedPosition();
                    if(lastPos != null) setPosition(lastPos);
                });
            }
        };
    })
    .directive('bgPane', function () {
        return {
            restrict: 'E',
            require: '^bgSplitter',
            replace: true,
            transclude: true,
            scope: {
                minSize: '='
            },
            template: '<div class="split-pane{{index}}" ng-transclude></div>',
            link: function(scope, element, attrs, bgSplitterCtrl) {
                scope.elem = element;
                scope.index = bgSplitterCtrl.addPane(scope);
            }
        };
    });
