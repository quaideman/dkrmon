var socket = io.connect('http://' + document.domain + ':' + location.port);


var ui = {
  defaults: function(){
    var mods = $('.mod');
    // Set collapse/expand button tooltips
    // $('button[data-fn="togglePause"]').attr('title','Toggle Pause');
    // $('button[data-fn="toggleCollapse"]').attr('title','Toggle Collapse');
    // $('button[data-fn="collapse"]').attr('title','Toggle Collapse');
    // $('button[data-fn="expandHost"]').attr('title','Expand Host');
    // $('button[data-fn="collapseHost"]').attr('title','Collapse Host');
    // Set collapse and pause states.
    mods.each(function(){
      $(this).attr('data-collapsed','false');
      $(this).find('button[data-fn="toggleCollapse"] .icn').text('expand_less')
      $(this).attr('data-paused','false');
      $(this).find('button[data-fn="togglePause"] .icn').text('pause');

    })
    // Disable modals
    $('.modal').each(function(){
      $(this).attr('data-active','false');
    })
    // Disable dashboard selector
    $('.dashboard-selector-wrap').attr('data-active','false');
  },
  viewMode: function(){
    var width = $(window).innerWidth();
    // if (width >= 1700) {return 'large'}
    if (width >= 1700) {return 'medium'}
    if (width < 1700 && width >= 1000) {return 'medium'}
    if (width < 1000 && width >= 600) {return 'small'}
    if (width < 600) {return 'xsmall'}
  },
  notify: function(data){
    var element = $('#notify');
    element.empty();
    $.each(data,function(){
      if (this['result'] == 'success') {var icon = 'check_circle'} else {var icon = 'error_outline'};
      var html = '<div><span class="icon '+this['result']+' material-icons">'+icon+'</span><span class="message">'+this['container']+'</span></div>'
      element.append(html);
    })
    element.clearQueue().fadeIn(200).delay(5000).fadeOut(200);
  },
  spinner: function(destroy){
    // Show waiting spinner
    var element = $('#spinner-wrap');
    if (destroy == 'destroy') {
      element.clearQueue().fadeOut(200);
    } else {
      element.clearQueue().fadeIn(200);
    }

  },
  jsonPretty : function(json){
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
  },
}

var dashboardControls = {
  global: function(){
    // Close modals
    $('[data-fn="modalClose"]').click(function(){
      modal.close($(this));
    })
  },
  dashboard: function(){
    // Collapse all modues in dashboard
    $('button[data-fn="dashboardCollapse"]').click(function(){
      $('.host').each(function(){
        $(this).find('.mod[data-mod="containers"]').attr('data-collapsed','true');
        $(this).find('.mod [data-fn="toggleCollapse"] .icn').text('expand_more');
      })
    })
    // Expand all modues in dashboard
    $('button[data-fn="dashboardExpand"]').click(function(){
      $('.host').each(function(){
        $(this).find('.mod').attr('data-collapsed','false');
        $(this).find('.mod [data-fn="toggleCollapse"] .icn').text('expand_less');
      })
    })
    // Change Dashboard
    $('button[data-fn="dashboardSelect"]').click(function(){
      var selector = $('.dashboard-selector-wrap')
      var status = selector.attr('data-active');
      if (status == 'false') {
        selector.attr('data-active','true');
      } else {
        selector.attr('data-active','false');
      }
      selector.find('.dashboard-list .item').click(function(){
        var dash = $(this).text();
        document.location.assign('/dashboard/'+dash);
      })
    })
    // Dashboard Filtering
    var availableDashboards = $('.dashboard-list .item');
    var filterDelay;
    $('[data-fn="filterDashboards"]').keydown(function(){
      var thisEl = $(this)
      clearTimeout(filterDelay);
      filterDelay = setTimeout(function(){
        var query = thisEl.val();
        if ( query.length > 0 ) {
          // Get the items that match query
          var items = []
          availableDashboards.each(function(){
            if ($(this).text().indexOf(query) >= 0) {
              items.push($(this).text());
            }
          })
          // Hide all items that are not in rows
          if ( items.length > 0 ) {
            availableDashboards.each(function(){
              if ( $.inArray( $(this).text(), items) > -1 ) {
                $(this).show()
              } else {
                $(this).hide()
              }
            })
          }
        } else {
          availableDashboards.each(function(){
            $(this).show();
          })
        }
      }, 300);
    })
  },
  host: function(){

    // Collapse host
    // $('.host button[data-fn="collapseHost"]').click(function(){
    //   $(this).parents('.host').find('.mod').each(function(){
    //     $(this).attr('data-collapsed','true');
    //     $(this).find('[data-fn="toggleCollapse"] .icn').text('expand_more');
    //   })
    // })
    // Expand host
    // $('.host button[data-fn="expandHost"]').click(function(){
    //   $(this).parents('.host').find('.mod').each(function(){
    //     $(this).attr('data-collapsed','false');
    //     $(this).find('[data-fn="toggleCollapse"] .icn').text('expand_less');
    //   })
    // })
    // Pause host
    // $('.host button[data-fn="pauseHost"]').click(function(){
    //   var mods = $(this).parents('.host').find('.mod');
    //   mods.each(function(){
    //     $(this).attr('data-paused','true');
    //   })
    // })
    // Resume host
    // $('.host button[data-fn="resumeHost"]').click(function(){
    //   var mods = $(this).parents('.host').find('.mod');
    //   mods.each(function(){
    //     $(this).attr('data-paused','false');
    //   })
    // })
    // Volumes
    $('.host button[data-fn="volumes"]').click(function(){
      var thisHost = $(this).parents('.host');
      modal.volumes.load(thisHost)
    })
    // Images
    $('.host button[data-fn="images"]').click(function(){
      var thisHost = $(this).parents('.host');
      modal.images.load(thisHost)
    })
  },
  mod: function(){
    // Toggle collapse module
    $('.mod header [data-fn="toggleCollapse"]').click(function(){
      var mode = ui.viewMode();
      var thisMod = $(this).parents('.mod');
      var thisHost = thisMod.parents('.host');
      var collapsed = thisMod.attr('data-collapsed');
      // Collapse different combinations depending on mode
      switch(mode){
        case 'large':
          // Host Mods
          if (thisMod.attr('data-mod') == 'hostDetails' ||
              thisMod.attr('data-mod') == 'hostCpu' ||
              thisMod.attr('data-mod') == 'hostMemory' ||
              thisMod.attr('data-mod') == 'hostStorage')
          {
            var mods = thisHost.find('[data-mod="hostDetails"],[data-mod="hostCpu"],[data-mod="hostMemory"],[data-mod="hostStorage"]');
            if (collapsed == 'false') {
              collapse(mods);
            } else {
              expand(mods);
            }
          }
          // Images, Volumes and Containers
          if (thisMod.attr('data-mod') == 'images' || thisMod.attr('data-mod') == 'volumes' || thisMod.attr('data-mod') == 'containers') {
            var mods = thisHost.find('[data-mod="images"],[data-mod="volumes"],[data-mod="containers"]');
            if (collapsed == 'false') {
              collapse(mods);
            } else {
              expand(mods);
            }
          }
          break;
        case 'medium':
          // Host Mods
          if (thisMod.attr('data-mod') == 'hostDetails' ||
              thisMod.attr('data-mod') == 'hostCpu' ||
              thisMod.attr('data-mod') == 'hostMemory' ||
              thisMod.attr('data-mod') == 'hostStorage')
          {
            var mods = thisHost.find('[data-mod="hostDetails"],[data-mod="hostCpu"],[data-mod="hostMemory"],[data-mod="hostStorage"]');
            if (collapsed == 'false') {
              collapse(mods);
            } else {
              expand(mods);
            }
          }
          // Images and Volumes
          if (thisMod.attr('data-mod') == 'images' || thisMod.attr('data-mod') == 'volumes') {
            var mods = thisHost.find('[data-mod="images"],[data-mod="volumes"]');
            if (collapsed == 'false') {
              collapse(mods);
            } else {
              expand(mods);
            }
          }
          // Containers
          if (thisMod.attr('data-mod') == 'containers') {
            if (collapsed == 'false') {
              collapse(thisMod);
            } else {
              expand(thisMod);
            }
          }
          break;
        case 'small':
          // Host Details and Host CPU
          if (thisMod.attr('data-mod') == 'hostDetails' || thisMod.attr('data-mod') == 'hostCpu') {
            var mods = thisHost.find('[data-mod="hostDetails"],[data-mod="hostCpu"]');
            if (collapsed == 'false') {
              collapse(mods);
            } else {
              expand(mods);
            }
          }
          // Host Memory and Host Storage
          if (thisMod.attr('data-mod') == 'hostMemory' || thisMod.attr('data-mod') == 'hostStorage') {
            var mods = thisHost.find('[data-mod="hostMemory"],[data-mod="hostStorage"]');
            if (collapsed == 'false') {
              collapse(mods);
            } else {
              expand(mods);
            }
          }
          // Containers, Volumes and Images
          if (thisMod.attr('data-mod') == 'containers' || thisMod.attr('data-mod') == 'volumes' || thisMod.attr('data-mod') == 'images') {
            if (collapsed == 'false') {
              collapse(thisMod);
            } else {
              expand(thisMod);
            }
          }
          break;
        case 'xsmall':
          // All Mods are independant
          if (collapsed == 'false') {
            collapse(thisMod);
          } else {
            expand(thisMod);
          }
          break;
      }

      function collapse(mods){
        mods.each(function(){
          $(this).attr('data-collapsed','true')
          $(this).find('[data-fn="toggleCollapse"] .icn').text('expand_more');
        })
      }

      function expand(mods){
        mods.each(function(){
          $(this).attr('data-collapsed','false')
          $(this).find('[data-fn="toggleCollapse"] .icn').text('expand_less');
        })
      }

    })
    // Toggle pause module
    $('button[data-fn="togglePause"]').click(function(){
      var mod = $(this).parents('.mod');
      var state = mod.attr('data-paused');
      if (state == 'false') {
        mod.attr('data-paused','true');
      } else {
        mod.attr('data-paused','false');
        // Clear any selected cells and disable controls
        mod.find('.cell.selected').removeClass('selected');
        mod.find('[data-fn^="container"]').prop('disabled','true');
      }
    })
    // Pause module on section click
    $('.mod section').click(function(){
      $(this).parents('.mod').attr('data-paused','true');
    })
  },
  // Actions
  load: function(){
    this.global();
    this.dashboard();
    this.host();
    this.mod();
  },
}

function buildTable(container,data,columns,pageLimit){
  function cellFormat(key,data){
    //  Formats table data cells when they contain objects
    // console.log(key,data);
    // Is there valid obects
    if (data.length > 0 || Object.keys(data).length > 0) {
      switch (key) {
        case 'Ports':
          // Iterate over X number of ports
          returnData = ""
          $.each(data,function(i,v){
            returnData += v['IP']+':'+v['PublicPort']+':'+v['PrivatePort']+'/'+v['Type']
          })
          break;
        case 'Names':
        case 'RepoTags':
          // Iterate over X number of names
          returnData = ""
          $.each(data,function(i,v){
            returnData += v
          })
          break;
        case 'Labels':
        case 'UsageData':
          // Iterate over X number of names
          returnData = ""
          $.each(data,function(i,v){
            returnData += i+":"+v+" "
          })
          break;
        default:
          returnData = "NO MATCH"
      }
      return returnData
    } else {
      return "NA"
    }
  }
  var table = container.find('[data-table]');
  var currentPageBadge = container.find('[data-value="currentPage"]');
  table.empty();
  // Build headers
  var columnCount = 0;
  $.each(data[0],function(i,v){
    if ($.inArray(i,columns) > -1) {
      var cell = '<div class="cell-head" data-column="'+i+'">'+i+'</div>'
      columnCount += 1;
      table.append(cell)
    }
  })
  table.css('grid-template-columns','repeat('+columnCount+',1fr)')
  // Build rows
  var pageCount = 1
  var rowCount = 1
  // Iterarte over top level data objects
  $.each(data,function(i,v){
    // Iterarte over the inner objects
    $.each(v,function(i,v){
      // Make sure the object is in the columns list
      if ($.inArray(i,columns) > -1) {
        // Check whether the objet is an array that needs more iteration
        if ($.type(v) == "array" || $.type(v) == "object" ) {
          var value = cellFormat(i,v);
          var cell = '<div class="cell" data-page="'+pageCount+'" data-row="'+rowCount+'" data-column="'+i+'" title="'+value+'">'+value+'</div>'
        } else {
          var cell = '<div class="cell" data-page="'+pageCount+'" data-row="'+rowCount+'" data-column="'+i+'" title="'+v+'">'+v+'</div>'
        }
        // Append the created cell to the table DOM
        table.append(cell)
      }
    })
    // Increment page numbers
    if (Number.isInteger(rowCount / pageLimit) ) {pageCount += 1}
    rowCount += 1;
  })
  // Add row hover
  table.find('.cell').hover(function(){
    var row = $(this).attr('data-row');
    var page = $(this).attr('data-page');
    $(this).toggleClass('hovered').siblings('[data-row="'+row+'"][data-page="'+page+'"]').toggleClass('hovered');
  })

  // Pagination
  container.find('[data-fn="nextPage"]').off().click(function(){
    var currentPage = parseInt(table.attr('data-page'))
    var currentFilterPage = parseInt(table.attr('data-filterPage'))
    var nextPage = currentPage + 1;
    var nextFilterPage = currentFilterPage + 1;
    // If a filter is applied, go to next filterPage
    if ( table.attr('data-filter') ) {
      // Load next page if exists
      if ( table.find('.cell[data-filterPage="'+nextFilterPage+'"]').length > 0 ) {
        currentPageBadge.text(nextFilterPage)
        table.attr('data-filterPage',nextFilterPage)
        table.find('.cell[data-filterPage="'+currentFilterPage+'"]').hide();
        table.find('.cell[data-filterPage="'+nextFilterPage+'"]').show();
      }
    } else {
      // Otherwise, go to next page
      if ( table.find('.cell[data-page="'+nextPage+'"]').length > 0 ) {
        currentPageBadge.text(nextPage)
        table.attr('data-page',nextPage)
        table.find('.cell[data-page="'+currentPage+'"]').hide();
        table.find('.cell[data-page="'+nextPage+'"]').show();
      }
    }

  })
  container.find('[data-fn="previousPage"]').off().click(function(){
    var currentPage = parseInt(table.attr('data-page'))
    var currentFilterPage = parseInt(table.attr('data-filterPage'))

    if ( table.attr('data-filter') ) {
      if (currentFilterPage > 1) {
        var prevFilterPage = currentFilterPage - 1;
        // If a filter is applied, go to previous filterPage
        currentPageBadge.text(prevFilterPage)
        table.attr('data-filterPage',prevFilterPage)
        table.find('.cell[data-filterPage="'+currentFilterPage+'"]').hide();
        table.find('.cell[data-filterPage="'+prevFilterPage+'"]').show();
      }
    } else {
      if (currentPage > 1) {
        // Otherwise, go to the previous page
        var prevPage = currentPage - 1;
        currentPageBadge.text(prevPage)
        table.attr('data-page',prevPage)
        table.find('.cell[data-page="'+currentPage+'"]').hide();
        table.find('.cell[data-page="'+prevPage+'"]').show();
      }
    }
  })

  // If page not set, deafult to 1
  var currentPage = table.attr('data-page')
  if ( ! currentPage ) {
    table.attr('data-page','1')
    container.find('[data-value="currentPage"]').text(1);
    table.find('.cell[data-page="1"]').show();
  } else {
    container.find('[data-value="currentPage"]').text(parseInt(currentPage));
    table.find('.cell[data-page="'+parseInt(currentPage)+'"]').show();
  }
  // Apply any filters that may be applied
  var tableFilter = table.attr('data-filter');
  if ( tableFilter ) {
    filterTable(tableFilter,container)
  }
}
function filterTable(query,container){
    var table = container.find('[data-table]');
    currentPage = table.attr('data-page');
    table.attr('data-filterPage',1)
    // Apply Filtering
    if ( query.length > 0 ) {
      // Set the current filter
      table.attr('data-filter',query);
      // Clear exiting filterPage attributes
      table.find('.cell').each(function(){
        $(this).removeAttr('data-filterPage');
      })
      // Get the rows that match query
      var rows = []
      var page = 1
      var count = 1
      table.find('.cell').each(function(){
        if ($(this).text().indexOf(query) >= 0) {
          // Append row to rows
          if ($.inArray($(this).attr('data-row'),rows) == -1 ) {
            rows.push($(this).attr('data-row'));
          }
        }
      })
      // Paginate the filtered rows
      var filterPage = 1
      var filterCount = 0
      if ( rows.length > 0 ) {
        $.each(rows,function(i,v){
          if ( filterCount == 10 ) {
            filterPage += 1
            filterCount = 0
          }
          filterCount += 1
          table.find('.cell[data-row="'+v+'"]').each(function(){
            $(this).attr('data-filterPage',filterPage)
          })
        })
      }

      // Hide rows that do not match filter
      if ( rows.length > 0 ) {
        table.find('.cell').each(function(){
          if ( $.inArray( $(this).attr('data-row'), rows) > -1 && $(this).attr('data-filterPage') == 1 ) {
            container.find('[data-value="currentPage"]').text(1)
            $(this).show()
          } else {
            $(this).hide()
          }
        })
      }
    } else {
      table.removeAttr('data-filter');
      table.find('.cell').removeAttr('data-filterPage');
      table.find('.cell[data-page]').hide();
      table.find('.cell[data-page="'+currentPage+'"]').each(function(){
        container.find('[data-value="currentPage"]').text(currentPage)
        $(this).show();
      })
    }
}

// Modules
var mod = {
  hostStats: {
    load : function(thisHost){
      // Make initial request
      serverRequest({'request': 'hostStats', 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisHost.attr('data-host')})
    },
    populate : function(thisHost,data){
      if (data == undefined) {
        // Assume this is a load request
        this.load(thisHost);
      } else {
        // Populate stats
        var thisMod = thisHost.find('[data-mod="hostStats"]')
        if (thisHost && data['result'] == 'success') {
          $.each(data['stats'],function(key,value){
            var submod = thisMod.find('[data-stat="'+key+'"]');
            var bar = submod.find('.progress-bar');
            var detail = submod.find('.stat-detail .value');
            bar.css('width',value+'%');
            detail.text(value+'%')
            if ( value <= 60 ) { bar.removeClass('mid high').addClass('low') }
            if ( value > 60 && value <= 75 ) { bar.removeClass('low high').addClass('mid') }
            if ( value > 75 ) { bar.removeClass('low mid').addClass('high') }
          })
        } else {
          // Reset progress bars
          thisMod.find('.progress-bar').css('width','0%');
          thisMod.find('.stat-detail .value').text('0%');
        }
      }
    },
  },
  containers : {
    load: function(thisHost) {
      // Load each containers module
      var thisDashboard = $('.dashboard').attr('data-dashboard');
      var thisMod = thisHost.find('[data-mod="containers"]');
      var thisTable = thisMod.find('[data-table]');
      var currentPageBadge = thisMod.find('[data-value="currentPage"]');
      function loadControls(){
        // Filter handler
        var filterDelay;
        thisMod.find('[data-fn="filterTable"]').keydown(function(){
          var thisEl = $(this)
          clearTimeout(filterDelay);
          filterDelay = setTimeout(function(){
            var query = thisEl.val();
            filterTable(query,thisMod);
          }, 300);
        })
        // Attach events to control buttons
        thisMod.find('[data-fn^="container"]').click(function(){
          var thisFn = $(this).attr('data-fn')
          // Get selected containers
          var selectedCells = thisTable.children('.cell.selected[data-column="Id"]');
          var selectedContainers = []
          selectedCells.each(function(){
            selectedContainers.push($(this).text());
          })

          if (thisFn == 'containerStop' || thisFn == 'containerStart' || thisFn == 'containerRestart' ) {
            thisMod.attr('data-paused','false')
            serverRequest({'request': thisFn, 'dashboard': thisDashboard, 'host': thisHost.attr('data-host'), 'containers': selectedContainers});
          }

          if ( thisFn == 'containerLog' ) {
            var modalEl = $('[data-modal="containerLog"]')
            modal.display(modalEl)
            modalEl.attr('data-container',selectedContainers[0])
            modalEl.attr('data-host',thisHost.attr('data-host'))
            serverRequest({'request': thisFn, 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisHost.attr('data-host'), 'container': selectedContainers[0]})
          }

          if ( thisFn == 'containerInspect' ) {
            var modalEl = $('[data-modal="containerInspect"]')
            modal.display(modalEl)
            modalEl.attr('data-container',selectedContainers[0])
            modalEl.attr('data-host',thisHost.attr('data-host'))
            serverRequest({'request': thisFn, 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisHost.attr('data-host'), 'container': selectedContainers[0]})
          }
        })
        // Make initial request
        serverRequest({'request': 'containers', 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisHost.attr('data-host')})
      }
      loadControls()
    },
    populate: function(thisHost,data){
      var thisDashboard = $('.dashboard').attr('data-dashboard');
      var thisMod = thisHost.find('[data-mod="containers"]');
      var thisSection = thisMod.find('section');
      var thisTable = thisSection.find('[data-table]');
      var hostStatusBadge = thisHost.find('[data-value="hostStatus"]').parent();
      // If data is not present, make a request
      if (data == undefined) {
        serverRequest({'request': 'containers', 'dashboard': thisDashboard, 'host': thisHost.attr('data-host')});
      } else {
        if (data['data']) {
          if (thisMod.attr('data-paused') == 'false') {
            // Enable the pause button if previously disabled
            thisMod.find('[data-fn="togglePause"]').prop('disabled',false);
            // Update the host status
            hostStatusBadge.removeClass('cRed').addClass('cGreen').attr('title','Agent Healthy');
            hostStatusBadge.children('span').text('done');
            thisSection.removeClass('placeholder');
            // Disable container buttons
            thisMod.find('footer .footer-controls [data-fn^="container"]').prop('disabled', true);
            // Populate table with data
            var columns = ['Id','Names','Command','Created','Image','Names','Ports','State','Status'];
            buildTable(thisMod,data['data'],columns,10)
            // Get counts
            countTotal = data['data'].length; countRunning = 0; countExited = 0; countHealthy = 0; countUnhealthy = 0; countStarting = 0
            $.each(data['data'],function(i,v){
              if (v['State'].indexOf('running') >= 0) {countRunning += 1};
              if (v['State'].indexOf('exited') >= 0) {countExited += 1};
              if (v['State'].indexOf('starting') >= 0) {countStarting += 1};
              if (v['Status'].indexOf('(healthy)') >= 0) {countHealthy += 1};
              if (v['Status'].indexOf('(unhealthy)') >= 0) {countUnhealthy += 1};
            })
            // Update totals badge
            thisMod.find('.header-controls [data-value="total"]').attr('title','Total').text('T:'+countTotal);
            thisMod.find('.header-controls [data-value="running"]').attr('title','Running').text('R:'+countRunning).addClass('running');
            thisMod.find('.header-controls [data-value="exited"]').attr('title','Exited').text('E:'+countExited).addClass('exited');
            thisMod.find('.header-controls [data-value="starting"]').attr('title','Starting').text('S:'+countStarting).addClass('starting');
            thisMod.find('.header-controls [data-value="healthy"]').attr('title','Healthy').text('H:'+countHealthy).addClass('healthy');
            thisMod.find('.header-controls [data-value="unhealthy"]').attr('title','Unhealthy').text('U:'+countUnhealthy).addClass('unhealthy');
            // Style the table
            thisTable.find('.cell[data-column="State"]').each(function(){
              if ($(this).text().indexOf('exited') >= 0) {$(this).addClass('exited')}
              if ($(this).text().indexOf('running') >= 0) {$(this).addClass('running')}
            })
            thisTable.find('.cell[data-column="Status"]').each(function(){
              if ($(this).text().indexOf('healthy') >= 0) {$(this).addClass('healthy')}
              if ($(this).text().indexOf('unhealthy') >= 0) {$(this).addClass('unhealthy')}
              if ($(this).text().indexOf('Exited') >= 0) {$(this).addClass('exited')}
            })
            // Apply any filters that may be applied
            var tableFilter = thisTable.attr('data-filter');
            if ( tableFilter ) { tableFilter(tableFilter,thisTable) }
            // Row select
            thisTable.find('.cell').click(function(){
              var row = $(this).attr('data-row');
              var page = $(this).attr('data-page');
              $(this).toggleClass('selected').siblings('[data-row="'+row+'"][data-page="'+page+'"]').toggleClass('selected');
              var selectedCells = thisTable.children('.cell.selected[data-column="Id"]');
              // If more than one container selected, disable log/inspect/top
              if ( selectedCells.length > 1 ) {
                thisMod.find('[data-fn="containerTop"],[data-fn="containerLog"],[data-fn="containerInspect"]').prop('disabled', true);
              } else {
                thisMod.find('footer .footer-controls [data-fn^="container"]').prop('disabled', false);
              }
            })
          }
        } else {
          // If no data reieved assume agent offline
          thisMod.attr('data-paused','false');
          thisMod.find('[data-fn="togglePause"]').prop('disabled',true);
          // Update host status
          hostStatusBadge.removeClass('cGreen').addClass('cRed').attr('title','Agent Unhealthy');
          hostStatusBadge.children('span').text('clear');
          thisSection.addClass('placeholder')
          thisTable.html('<div>Unable to connect to host</div>').css('grid-template-columns','auto');
          // Disable container buttons
          thisMod.find('footer .footer-controls [data-fn^="container"]').prop('disabled', true);
        }
      }
    },
  },
}

// Modals
var modal = {
  display: function(modal){
    $('#modal-container').attr('data-active','true');
    modal.attr('data-active','true');
  },
  close: function(trigger){
    $('#modal-container').attr('data-active','false');
    trigger.parents('.modal').attr('data-active','false');
    // Empty any Tables
    trigger.parents('.modal').find('[data-table]').empty()
  },
  containerLog : {
    load : function(log){
      var thisModal = $('[data-modal="containerLog"]');
      var thisSection = thisModal.find('section');
      var preEl = thisSection.find('.pre')
      preEl.empty();
      if ( log.length == 1 && log[0].length == 0 ) {
        preEl.html('<div class="placeholder">Nothing to see here</div>');
      } else {
        // thisSection.html('<pre></pre>');
        $.each(log,function(i,v){
          if (v) {preEl.append('<div class="value">'+v+'</div>')}
        })
      }
      // Refresh
      thisModal.find('[data-fn="refresh"]').off().click(function(){
        serverRequest({'request': 'containerLog', 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisModal.attr('data-host'),'container': thisModal.attr('data-container')})
      })
      // scrollTop
      thisModal.find('[data-fn="scrollTop"]').off().click(function(){
        thisModal.find('section .pre').scrollTop(0);
      });
      // scrollBottom
      thisModal.find('[data-fn="scrollBottom"]').off().click(function(){
        thisModal.find('section .pre').scrollTop(thisModal.find('section .pre')[0].scrollHeight);
      });
    },
  },
  containerInspect : {
    load : function(details){
      var thisModal = $('[data-modal="containerInspect"]');
      var thisSection = thisModal.find('section');
      var preEl = thisSection.find('.pre')
      preEl.empty();
      var jsonData = ui.jsonPretty(JSON.stringify(details,null,2));
      preEl.html(jsonData)
      // Refresh
      $('[data-fn="refresh"]').off().click(function(){
        serverRequest({'request': 'containerInspect', 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisModal.attr('data-host'),'container': thisModal.attr('data-container')})
      })
      // scrollTop
      thisModal.find('[data-fn="scrollTop"]').off().click(function(){
        thisModal.find('section .pre').scrollTop(0);
      });
      // scrollBottom
      thisModal.find('[data-fn="scrollBottom"]').off().click(function(){
        thisModal.find('section .pre').scrollTop(thisModal.find('section .pre')[0].scrollHeight);
      });
    },
  },
  volumes : {
    load : function(thisHost){
      var thisModal = $('[data-modal="volumes"]');
      modal.display(thisModal);
      var thisSection = thisModal.find('section');
      var thisTable = thisSection.find('[data-table]');
      var currentPageBadge = thisModal.find('[data-value="currentPage"]');
      function loadControls(){
        // Filter handler
        var filterDelay;
        thisModal.find('[data-fn="filterTable"]').off().keydown(function(){
          var thisEl = $(this)
          clearTimeout(filterDelay);
          filterDelay = setTimeout(function(){
            var query = thisEl.val();
            filterTable(query,thisModal)
            // mod.containers.filter(query,thisTable);
          }, 300);
        })
      }
      loadControls();
      // Make initial request
      serverRequest({'request': 'volumes', 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisHost.attr('data-host')})
    },
    populate: function(data){
      var thisModal = $('[data-modal="volumes"]');
      var thisSection = thisModal.find('section');
      var thisTable = thisSection.find('[data-table]');

      var columns = ['CreatedAt','Driver','Mountpoint','Name','Scope','UsageData','Labels'];
      buildTable(thisModal,data['volumes'],columns,10);
      // If page not set, deafult to 1
      var currentPage = thisModal.find('[data-value="currentPage"]').text();
      if ( ! currentPage ) {
        thisModal.find('[data-value="currentPage"]').text(1);
        thisTable.find('.cell[data-page="1"]').show();
      } else {
        thisModal.find('[data-value="currentPage"]').text(parseInt(currentPage));
        thisTable.find('.cell[data-page="'+parseInt(currentPage)+'"]').show();
      }
    },
  },
  images : {
    load : function(thisHost){
      var thisModal = $('[data-modal="images"]');
      modal.display(thisModal);
      var thisSection = thisModal.find('section');
      var thisTable = thisSection.find('[data-table]');
      var currentPageBadge = thisModal.find('[data-value="currentPage"]');
      function loadControls(){
        // Filter handler
        var filterDelay;
        thisModal.find('[data-fn="filterTable"]').off().keydown(function(){
          var thisEl = $(this)
          clearTimeout(filterDelay);
          filterDelay = setTimeout(function(){
            var query = thisEl.val();
            filterTable(query,thisModal)
            // mod.containers.filter(query,thisTable);
          }, 300);
        })
      }
      loadControls();
      // Make initial request
      serverRequest({'request': 'images', 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisHost.attr('data-host')})
    },
    populate: function(data){
      var thisModal = $('[data-modal="images"]');
      var thisSection = thisModal.find('section');
      var thisTable = thisSection.find('[data-table]');

      var columns = ['Id','RepoTags','Containers','Labels','ParentId','Size','Created'];
      buildTable(thisModal,data['images'],columns,10);
      // If page not set, deafult to 1
      var currentPage = thisModal.find('[data-value="currentPage"]').text();
      if ( ! currentPage ) {
        thisModal.find('[data-value="currentPage"]').text(1);
        thisTable.find('.cell[data-page="1"]').show();
      } else {
        thisModal.find('[data-value="currentPage"]').text(parseInt(currentPage));
        thisTable.find('.cell[data-page="'+parseInt(currentPage)+'"]').show();
      }
    },
  },
}

// Stuff to run on load
$(document).ready(function(){
  ui.defaults()
  dashboardControls.load()
  $('.host').each(function(){
    mod.hostStats.load($(this));
    mod.containers.load($(this));
  })

})

// Stuff to do on window resize
$(window).resize(function(){
  // $('.tabulator').tabulator("redraw");
})

// Stuff to do on interval
window.setInterval(function(){
  // ui.refresh();
  // serverRequest('dkrDetails');
  $('.host').each(function(){
    mod.containers.populate($(this));
    mod.hostStats.populate($(this));
  })
}, 10000);

// Server Requests
function serverRequest(request){
  console.log('serverRequest',request);
  if ( request['request'] == 'containerStart' || request['request'] == 'containerStop' || request['request'] == 'containerRestart' ) { ui.spinner() }
  socket.emit('serverRequest', request);
}

// Server Responses
socket.on('serverResponse', function(data) {
  if ( data['request'] == 'containerStart' || data['request'] == 'containerStop' || data['request'] == 'containerRestart' ) { ui.spinner('destroy') }
  console.log("serverResponse",data);
  var host = $('[data-host="'+data['host']+'"]');
  switch (data['request']) {
    case 'containers':
      mod.containers.populate(host,data);
      break;
    case 'containerStop':
    case 'containerStart':
    case 'containerRestart':
      mod.containers.populate(host);
      ui.notify(data['data'])
      break;
    case 'containerLog':
      modal.containerLog.load(data['log'])
      break;
    case 'containerInspect':
      modal.containerInspect.load(data['details'])
      break;
    case 'hostStats':
      mod.hostStats.populate(host,data)
      break;
    case 'volumes':
      modal.volumes.populate(data)
      break;
    case 'images':
      modal.images.populate(data)

  }

});
