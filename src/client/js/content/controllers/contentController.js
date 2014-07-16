angular.module('RequelPro').controller('ContentController', ['$scope', '$log', '$location', 'DS', '$state', '$timeout', 'mout',
  function ($scope, $log, $location, DS, $state, $timeout, mout) {
    $log.debug('Begin ContentController constructor');

    var _this = this;
    var r = require('rethinkdb');
    var prevTarget;
    var $prevTarget;

    function processRows(rows, tableInfo) {
      _this.primaryKey = tableInfo.primary_key;
      _this.fields = {};
      angular.forEach(rows, function (row) {
        mout.object.forOwn(row, function (value, key) {
          _this.fields[key] = typeof value;
        });
      });
      return rows;
    }

    function updateRow(index) {
      var connection;
      _this.processing = true;
      _this.connection.connect()
        .then(function (conn) {
          connection = conn;
          return r.db(_this.db).table(_this.table).get(_this.rows[index][_this.primaryKey]).update(_this.rows[index], { return_vals: true }).run(conn);
        })
        .then(function (cursor) {
          $timeout(function () {
            mout.object.deepMixIn(_this.rows[index], cursor.new_val);
          });
        })
        .catch(function (err) {
          $log.error(err);
        })
        .error(function (err) {
          $log.error(err);
        })
        .finally(function () {
          _this.processing = false;
          if (connection) {
            return connection.close();
          }
        });
    }

    this.selectRow = function (index) {
      if (this.selectedRow !== index && $prevTarget) {
        $prevTarget.find('input').addClass('ng-hide');
        $prevTarget.find('span').removeClass('ng-hide');
        prevTarget = null;
        $prevTarget = null;
      } else if (this.selectedRow === index) {
        return;
      }
      this.selectedRow = index;
    };

    this.selectField = function ($event, parentIndex) {
      if (parentIndex === this.selectedRow) {
        if (prevTarget && prevTarget !== $event.currentTarget) {
          $prevTarget.find('input').off('blur keydown').addClass('ng-hide');
          $prevTarget.find('span').removeClass('ng-hide');
          prevTarget = null;
          $prevTarget = null;
        } else {
          var $el = angular.element($event.currentTarget);
          var $input = $el.find('input');
          var $span = $el.find('span');

          $span.addClass('ng-hide');
          $input
            .removeClass('ng-hide')
            .on('blur', function () {
              console.log('save value as', $input.val());
              $input.off('blur keydown');
              $span.removeClass('ng-hide');
              $input.addClass('ng-hide');
              prevTarget = null;
              $prevTarget = null;
              updateRow(_this.selectedRow);
            })
            .on('keydown', function (e) {
              if (e.keyCode === 13) {
                console.log('save value as', $input.val());
                $input.off('keydown blur');
                $span.removeClass('ng-hide');
                $input.addClass('ng-hide');
                prevTarget = null;
                $prevTarget = null;
                updateRow(_this.selectedRow);
              }
            });
          prevTarget = $event.currentTarget;
          $prevTarget = $el;
        }
      }
    };

    try {
      DS.find('connection', $state.params.id);

      $scope.$watch(function () {
        return DS.lastModified('connection', $state.params.id);
      }, function () {
        _this.connection = DS.get('connection', $state.params.id);

        if (_this.connection) {
          _this.connection.dbList()
            .then(function (dbList) {
              $timeout(function () {
                $log.debug('dbList:', dbList);
                _this.dbList = dbList;
              });
            })
            .catch(function (err) {
              $log.error(err);
            })
            .error(function (err) {
              $log.error(err);
            });
        }
      });

      $scope.$watch('ContentCtrl.db', function (db) {
        if (db && _this.connection) {
          $log.debug('selected db:', db);
          _this.connection.tableList(db)
            .then(function (tableList) {
              $timeout(function () {
                $log.debug('tableList:', tableList);
                _this.tableList = tableList;
              });
            })
            .catch(function (err) {
              $log.error(err);
            })
            .error(function (err) {
              $log.error(err);
            });
        }
      });

      $scope.$watch('ContentCtrl.table', function (table) {
        if (table && _this.connection) {
          var connection;
          var tableInfo;
          _this.processing = true;
          _this.connection.connect()
            .then(function (conn) {
              connection = conn;
              return _this.connection.tableInfo(_this.db, table);
            })
            .then(function (t) {
              tableInfo = t;
              return r.db(_this.db).table(table).limit(1000).coerceTo('ARRAY').run(connection);
            })
            .then(function (rows) {
              $timeout(function () {
                _this.rows = processRows(rows, tableInfo);
              });
            })
            .catch(function (err) {
              $log.error(err);
            })
            .error(function (err) {
              $log.error(err);
            })
            .finally(function () {
              _this.processing = false;
              if (connection) {
                return connection.close();
              }
            });
        }
      });

      $log.debug('End ContentController constructor');
    } catch (err) {
      $log.error(err);
      $log.error('Failed to instantiate ContentController!');
      $location.path('500');
    }
  }
]);