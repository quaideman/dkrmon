// Establish a web socket
var socket = io.connect('http://' + document.domain + ':' + location.port);

// Global functions
function buildTable(container,data,columns,pageLimit){
  var table = container.find('[data-table]');
  var currentPageBadge = container.find('[data-value="currentPage"]');
  // Clear table out
  table.empty();
  // Build headers
  $.each(columns,function(i,v){
    var cell = '<div class="cell-head" data-column="'+v+'">'+v+'</div>'
    table.append(cell)
  })
  // Define grid columns
  table.css('grid-template-columns','repeat('+columns.length+',1fr)')
  // Build rows
  var pageCount = 1
  var rowCount = 1
  // Iterarte over array objects
  $.each(data,function(i,v){
    // Create the cell elements first in order of columns
    $.each(columns,function(i,column){
      var cell = '<div class="cell" data-page="'+pageCount+'" data-row="'+rowCount+'" data-column="'+column+'"></div>'
      table.append(cell)
    })
    // Iterarte over object attributes
    $.each(v,function(key,value){
      // Check whether the objet is an array or object that needs more iteration
      if ($.type(value) == "array" || $.type(value) == "object" ) {
        // Inject values into columns
        switch (key) {
          case 'Stats':
            // Calculate CPU Usage Pct
            var preCpuTotal = value['precpu_stats']['cpu_usage']['total_usage']
            var preCpuSystem = value['precpu_stats']['system_cpu_usage']
            var curCpuTotal = value['cpu_stats']['cpu_usage']['total_usage']
            var curCpuSystem = value['cpu_stats']['system_cpu_usage']
            var cpuTotalDelta = curCpuTotal - preCpuTotal
            var cpuSystemDelta = curCpuSystem - preCpuSystem
            var cpuPct = parseInt((cpuTotalDelta / cpuSystemDelta) * 100)
            var html = '<div class="bar-wrap"><div class="bar" style="width: '+cpuPct+'%"></div></div>'
            table.find('.cell[data-page="'+pageCount+'"][data-row="'+rowCount+'"][data-column="CPU"]').html(html).attr('title',cpuPct+'%')
            // Calculate Memory Usage Pct
            var memoryPct = parseInt((value['memory_stats']['usage'] / value['memory_stats']['limit']) * 100);
            var memoryUsageMb = parseInt( ((value['memory_stats']['usage']) / 1024) / 1024 )
            var memoryLimitMb = parseInt( ((value['memory_stats']['limit']) / 1024) / 1024 )
            var html = '<div class="bar-wrap"><div class="bar" style="width: '+memoryPct+'%"></div></div>'
            var tooltip = memoryPct+'% ('+ memoryUsageMb +'/'+ memoryLimitMb + 'MB)'
            table.find('.cell[data-page="'+pageCount+'"][data-row="'+rowCount+'"][data-column="Memory"]').html(html).attr('title',tooltip);
            // Network stats
            var networkTotalBytes = 0
            $.each(value['networks'],function(key,value){
              networkTotalBytes += value['rx_bytes']
            })
            table.find('.cell[data-page="'+pageCount+'"][data-row="'+rowCount+'"][data-column="Network"]').text(networkTotalBytes).attr('title',networkTotalBytes+' bytes');
            break;
          case 'Names':
            var names = ""
            $.each(value,function(key,value){ names += value })
            table.find('.cell[data-page="'+pageCount+'"][data-row="'+rowCount+'"][data-column="Names"]').text(names).attr('title',names);
            break;
          case 'Ports':
            // Iterate over X number of ports
            var ports = ""
            $.each(value,function(key,value){
              ports += this['IP']+':'+this['PublicPort']+':'+this['PrivatePort']+'/'+this['Type']
            })
            table.find('.cell[data-page="'+pageCount+'"][data-row="'+rowCount+'"][data-column="Ports"]').text(ports).attr('title',ports);
            break;
        }
      } else {
        // Inject value into columns
        table.find('.cell[data-page="'+pageCount+'"][data-row="'+rowCount+'"][data-column="'+key+'"]').text(value).attr('title',value);
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
    table.find('.cell[data-page="1"]').css('display','flex');
  } else {
    container.find('[data-value="currentPage"]').text(parseInt(currentPage));
    table.find('.cell[data-page="'+parseInt(currentPage)+'"]').css('display','flex');
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
function placeholder(state,section,message="No message") {
  if (state == 'show') {
    section.addClass('placeholder');
    section.find('.placeholder-msg').text(message)
    section.find('.placeholder-msg').siblings().hide();
  } else {
    section.removeClass('placeholder');
    section.find('.placeholder-msg').text('')
    section.find('.placeholder-msg').siblings().show();
  }
}

// Core
var ui = {
  defaults: function(){
    var mods = $('.mod');
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
  // viewMode: function(){
  //   var width = $(window).innerWidth();
  //   // if (width >= 1700) {return 'large'}
  //   if (width >= 1700) {return 'medium'}
  //   if (width < 1700 && width >= 1000) {return 'medium'}
  //   if (width < 1000 && width >= 600) {return 'small'}
  //   if (width < 600) {return 'xsmall'}
  // },
  notify: function(data){
    var element = $('#notify');
    element.empty();
    switch (data['request']) {
      case 'containerStart':
      case 'containerStop':
      case 'containerRestart':
        $.each(data['data'],function(){
          if (this['result'] == 'success') {var icon = 'check_circle'} else {var icon = 'error_outline'};
          var html = '<div><span class="icon '+this['result']+' material-icons">'+icon+'</span><span class="message">'+this['container']+'</span></div>'
          element.append(html);
        })
        break;
      case 'pruneVolumes':
        if (data['result'] == 'success') {var icon = 'check_circle'} else {var icon = 'error_outline'};
        if (data['resultData']['VolumesDeleted'] == null) {
          var html = '<div><span class="icon success material-icons">'+icon+'</span><span class="message">No volumes to prune</span></div>'
          element.append(html);
        } else {
          $.each(data['resultData']['VolumesDeleted'],function(){
            var html = '<div><span class="icon success material-icons">'+icon+'</span><span class="message">'+this+'</span></div>'
            element.append(html);
          })
        }

        break;
      case 'pruneImages':
        if (data['result'] == 'success') {var icon = 'check_circle'} else {var icon = 'error_outline'};
        if (data['resultData']['ImagesDeleted'] == null) {
          var html = '<div><span class="icon success material-icons">'+icon+'</span><span class="message">No images to prune</span></div>'
          element.append(html);
        } else {
          $.each(data['resultData']['ImagesDeleted'],function(){
            var html = '<div><span class="icon success material-icons">'+icon+'</span><span class="message">'+this+'</span></div>'
            element.append(html);
          })
        }

        break;
      default:
        var html = '<div><span class="icon error material-icons">error_outline</span><span class="message">Something went wrong</span></div>'
        element.append(html);
    }

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
var dashboard = {
  load: function(){
    // Close modals
    $('[data-fn="modalClose"]').click(function(){
      modal.close($(this));
    })
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
    // Toggle collapse module
    $('.mod header [data-fn="toggleCollapse"]').click(function(){
      // var mode = ui.viewMode();
      var thisMod = $(this).parents('.mod');
      var thisHost = thisMod.parents('.host');
      var collapsed = thisMod.attr('data-collapsed');
      if (collapsed == 'false') {
        thisMod.attr('data-collapsed','true');
        thisMod.find('[data-fn="toggleCollapse"] .icn').text('expand_more');
      } else {
        thisMod.attr('data-collapsed','false');
        thisMod.find('[data-fn="toggleCollapse"] .icn').text('expand_less');
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
        mod.find('[data-fn^="container"]').prop('disabled',true);
      }
    })
  },
}
var host = {
  health : {
    request : function(thisHost){
      serverRequest({'request': 'hostHealth', 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisHost.attr('data-host')})
    },
    response : function(thisHost,responseData){
      var status = responseData['result'];
      var badge = thisHost.find('[data-value="hostStatus"]');
      if (status == 'healthy') {
        thisHost.attr('data-status','healthy')
        badge.removeClass('cRed').addClass('cGreen').parent().attr('title','Healthy');
        // Request host stats
        host.cpu.request(thisHost);
        host.memory.request(thisHost)
        // Populate modules
        // mod.hostStats.request(thisHost);
        if (thisHost.find('[data-mod="containers"]').attr('data-paused') == 'false') {mod.containers.request(thisHost)}
      } else {
        thisHost.attr('data-status','unhealthy')
        badge.removeClass('cGreen').addClass('cRed').parent().attr('title','Unhealthy');
        host.unload(thisHost)
      }
    },
  },
  cpu : {
    request : function(thisHost){
      serverRequest({'request': 'hostCpu', 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisHost.attr('data-host')})
    },
    response : function(thisHost,responseData){
      var pct = responseData['cpuPct']
      var badge = thisHost.find('[data-value="hostCpuPct"]');
      var status;
      if (pct <= 50) {badge.removeClass('cRed cYellow').addClass('cGreen').parent().attr('title',pct+'%')}
      if (pct > 50 && pct <= 75) {badge.removeClass('cRed cGreen').addClass('cYellow').parent().attr('title',pct+'%')}
      if (pct > 75) {badge.removeClass('cYellow cGreen').addClass('cRed').parent().attr('title',pct+'%')}
    },
  },
  memory : {
    request : function(thisHost){
      serverRequest({'request': 'hostMemory', 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisHost.attr('data-host')})
    },
    response : function(thisHost,responseData){
      var pct = responseData['memoryPct']
      var badge = thisHost.find('[data-value="hostMemoryPct"]');
      var status;
      if (pct <= 50) {badge.removeClass('cRed cYellow').addClass('cGreen').parent().attr('title',pct+'%')}
      if (pct > 50 && pct <= 75) {badge.removeClass('cRed cGreen').addClass('cYellow').parent().attr('title',pct+'%')}
      if (pct > 75) {badge.removeClass('cYellow cGreen').addClass('cRed').parent().attr('title',pct+'%')}
    },
  },
  load : function(thisHost){
    // Enable host buttons
    thisHost.find('.header-controls button').prop('disabled',false);
    // Volumes button
    $('.host button[data-fn="volumes"]').click(function(){
      var thisHost = $(this).parents('.host');
      modal.volumes.load(thisHost)
    })
    // Images button
    $('.host button[data-fn="images"]').click(function(){
      var thisHost = $(this).parents('.host');
      modal.images.load(thisHost)
    })
    // Load modules
    mod.containers.load(thisHost);
  },
  unload : function(thisHost){
    // Unload modules
    mod.containers.unload(thisHost);
    // Disable buttons except collapse
    thisHost.find('.header-controls button').prop('disabled',true);
    // thisHost.find('.header-controls button[data-fn="toggleCollapse"]').prop('disabled',false);
    // Clear host stats
    thisHost.find('[data-value="hostCpuPct"]').removeClass('cGreen cRed cYellow');
    thisHost.find('[data-value="hostMemoryPct"]').removeClass('cGreen cRed cYellow');
    // Collapse modules
    thisHost.find('[data-mod]').attr('data-collapsed','true');
    thisHost.find('[data-fn="toggleCollapse"]').text('expand_more');
  },
}
var mod = {
  // hostStats: {
  //   unload : function(thisHost){
  //     var thisMod = thisHost.find('[data-mod="hostStats"]');
  //     thisMod.find('.progress-bar').css('width','0%');
  //     thisMod.find('.stat-detail .value').text('0%');
  //   },
  //   request : function(thisHost){
  //     serverRequest({'request': 'hostStats', 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisHost.attr('data-host')})
  //   },
  //   response : function(thisHost,responseData){
  //     // Populate stats
  //     var thisMod = thisHost.find('[data-mod="hostStats"]')
  //     $.each(responseData['stats'],function(key,value){
  //       var submod = thisMod.find('[data-stat="'+key+'"]');
  //       var bar = submod.find('.progress-bar');
  //       var detail = submod.find('.stat-detail .value');
  //       bar.css('width',value+'%');
  //       detail.text(value+'%')
  //       if ( value <= 60 ) { bar.removeClass('mid high').addClass('low') }
  //       if ( value > 60 && value <= 75 ) { bar.removeClass('low high').addClass('mid') }
  //       if ( value > 75 ) { bar.removeClass('low mid').addClass('high') }
  //     })
  //   },
  // },
  containers : {
    request: function(thisHost) {
      serverRequest({'request': 'containers', 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisHost.attr('data-host')});
    },
    response: function(thisHost,responseData) {
      var thisDashboard = $('.dashboard').attr('data-dashboard');
      var thisMod = thisHost.find('[data-mod="containers"]');
      var thisSection = thisMod.find('section');
      var thisTable = thisSection.find('[data-table]');
      // Enable the pause button if previously disabled
      // thisMod.find('[data-fn="togglePause"]').prop('disabled',false);
      thisHost.find('.header-controls button').prop('disabled',false);
      // Disable container buttons
      thisMod.find('footer .footer-controls [data-fn^="container"]').prop('disabled', true);
      // Populate table with data
      var columns = ['Names','Id','Command','Image','Ports','State','Status','Network','CPU','Memory'];
      buildTable(thisMod,responseData['data'],columns,10)
      // Get counts
      countTotal = responseData['data'].length; countRunning = 0; countExited = 0; countHealthy = 0; countUnhealthy = 0; countStarting = 0
      $.each(responseData['data'],function(i,v){
        if (v['State'].indexOf('running') >= 0) {countRunning += 1};
        if (v['State'].indexOf('exited') >= 0) {countExited += 1};
        if (v['State'].indexOf('starting') >= 0) {countStarting += 1};
        if (v['Status'].indexOf('(healthy)') >= 0) {countHealthy += 1};
        if (v['Status'].indexOf('(unhealthy)') >= 0) {countUnhealthy += 1};
      })
      // Update totals badge
      function updateBadge(value,count){
        var el = thisMod.find('.header-controls [data-value="'+value+'"]')
        el.parent().attr('title',value)
        el.text(count);
        // White out if zero
        if (count > 0) {el.addClass(value)} else {el.removeClass(value)}
      }

      updateBadge('total',countTotal)
      updateBadge('running',countRunning)
      updateBadge('exited',countExited)
      // updateBadge('starting',countStarting)
      updateBadge('healthy',countHealthy)
      updateBadge('unhealthy',countUnhealthy)
      // thisMod.find('.header-controls [data-value="total"]').attr('title','Total').text('T:'+countTotal);
      // thisMod.find('.header-controls [data-value="running"]').attr('title','Running').text('R:'+countRunning).addClass('running');
      // thisMod.find('.header-controls [data-value="exited"]').attr('title','Exited').text('E:'+countExited).addClass('exited');
      // thisMod.find('.header-controls [data-value="starting"]').attr('title','Starting').text('S:'+countStarting).addClass('starting');
      // thisMod.find('.header-controls [data-value="healthy"]').attr('title','Healthy').text('H:'+countHealthy).addClass('healthy');
      // thisMod.find('.header-controls [data-value="unhealthy"]').attr('title','Unhealthy').text('U:'+countUnhealthy).addClass('unhealthy');
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
      if ( tableFilter ) { filterTable(tableFilter,thisTable) }
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
      // Enable buttons
      thisMod.find('[data-fn="previousPage"],[data-fn="nextPage"]').prop('disabled',false);
    },
    load: function(thisHost) {
      // Load each containers module
      var thisDashboard = $('.dashboard').attr('data-dashboard');
      var thisMod = thisHost.find('[data-mod="containers"]');
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
        var selectedCells = thisMod.find('[data-table]').children('.cell.selected[data-column="Id"]');
        var selectedContainers = []
        selectedCells.each(function(){
          selectedContainers.push($(this).text());
        })
        if (thisFn == 'containerStop' || thisFn == 'containerStart' || thisFn == 'containerRestart') {
          thisMod.attr('data-paused','false')
          serverRequest({'request': thisFn, 'dashboard': thisDashboard, 'host': thisHost.attr('data-host'), 'containers': selectedContainers});
        }
        if (thisFn == 'containerLog') {
          var modalEl = $('[data-modal="containerLog"]')
          modal.display(modalEl)
          modalEl.attr('data-container',selectedContainers[0])
          modalEl.attr('data-host',thisHost.attr('data-host'))
          serverRequest({'request': thisFn, 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisHost.attr('data-host'), 'container': selectedContainers[0]})
        }
        if (thisFn == 'containerInspect') {
          var modalEl = $('[data-modal="containerInspect"]')
          modal.display(modalEl)
          modalEl.attr('data-container',selectedContainers[0])
          modalEl.attr('data-host',thisHost.attr('data-host'))
          serverRequest({'request': thisFn, 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisHost.attr('data-host'), 'container': selectedContainers[0]})
        }
      })
      // Add pause on section click
      thisMod.find('section').click(function(){
        if (thisHost.attr('data-status') == 'healthy') {
          $(this).parents('.mod').attr('data-paused','true');
        }
      })
    },
    unload: function(thisHost){
      var thisMod = thisHost.find('[data-mod="containers"]');
      // Clear out table contents
      thisMod.find('[data-table]').empty();
      // Empty badges
      thisMod.find('.header-controls .badge [data-value]').text('');
      // Remove pause on section click
      thisMod.find('section').off();
      // Disable footer buttons
      thisMod.find('footer .footer-controls button').prop('disabled', true);
      thisMod.find('[data-fn="togglePause"]').prop('disabled', true);
      // Empty page number
      thisMod.find('[data-value="currentPage"]').text('');
    },
  },
}
var modal = {
  display: function(modal){
    $('#modal-container').attr('data-active','true');
    modal.attr('data-active','true');
  },
  close: function(trigger){
    $('#modal-container').attr('data-active','false');
    trigger.parents('.modal').attr('data-active','false');
    // Empty any content
    trigger.parents('.modal').find('[data-table]').empty()
    trigger.parents('.modal').find('.placeholder-msg').text('')
  },
  containerLog : {
    load : function(log){
      var thisModal = $('[data-modal="containerLog"]');
      var thisSection = thisModal.find('section');
      var preEl = thisSection.find('.pre')
      preEl.empty();
      if ( log.length == 1 && log[0].length == 0 ) {
        placeholder('show',thisSection,'Log is empty...')

      } else {
        placeholder('hide',thisSection)
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
      thisModal.attr('data-host',thisHost.attr('data-host'))
      // Make initial request
      serverRequest({'request': 'volumes', 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisHost.attr('data-host')})
    },
    populate: function(data){
      var thisModal = $('[data-modal="volumes"]');
      var thisSection = thisModal.find('section');
      var thisTable = thisSection.find('[data-table]');
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
        // Refresh
        thisModal.find('[data-fn="refresh"]').off().click(function(){
          serverRequest({'request': 'volumes', 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisModal.attr('data-host')})
        })
        // Prune
        thisModal.find('[data-fn="prune"]').off().click(function(){
          serverRequest({'request': 'pruneVolumes', 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisModal.attr('data-host')})
        })
      }

      var columns = ['CreatedAt','Driver','Mountpoint','Name','Scope','UsageData','Labels'];
      if (data['volumes'] != undefined && data['volumes'].length > 0) {
        placeholder('hide',thisSection)
        buildTable(thisModal,data['volumes'],columns,10);
        loadControls();
      } else {
        placeholder('show',thisSection,'No volumes found...')
      }
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
      thisModal.attr('data-host',thisHost.attr('data-host'))
      // Make initial request
      serverRequest({'request': 'images', 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisHost.attr('data-host')})
    },
    populate: function(data){
      var thisModal = $('[data-modal="images"]');
      var thisSection = thisModal.find('section');
      var thisTable = thisSection.find('[data-table]');
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
        // Refresh
        thisModal.find('[data-fn="refresh"]').off().click(function(){
          serverRequest({'request': 'images', 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisModal.attr('data-host')})
        })
        // Prune
        thisModal.find('[data-fn="prune"]').off().click(function(){
          serverRequest({'request': 'pruneImages', 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisModal.attr('data-host')})
        })
      }

      var columns = ['Id','RepoTags','Containers','Labels','ParentId','Size','Created'];
      if (data['images'] != undefined && data['images'].length > 0) {
        placeholder('hide',thisSection)
        buildTable(thisModal,data['images'],columns,10);
        loadControls();
      } else {
        placeholder('show',thisSection,'No images found...')
      }

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
  dashboard.load()
  $('.host').each(function(){
    host.health.request($(this));
    host.load($(this))
  })
})

// Stuff to do on interval
window.setInterval(function(){
  $('.host').each(function(){
    host.health.request($(this));
  })
}, 10000);

// Server Requests
function serverRequest(request){
  console.log('serverRequest',request);
  if ( request['request'] == 'containerStart' || request['request'] == 'containerStop' || request['request'] == 'containerRestart' ) { ui.spinner() }
  socket.emit('serverRequest', request);
}

// Server Responses
socket.on('serverResponse', function(reponseData) {
  if (reponseData) {
    console.log("serverResponse",reponseData)
    if ( reponseData['request'] == 'containerStart' || reponseData['request'] == 'containerStop' || reponseData['request'] == 'containerRestart' ) { ui.spinner('destroy') }
    var hostEl = $('[data-host="'+reponseData['host']+'"]');
    switch (reponseData['request']) {
      case 'containers':
        // mod.containers.populate(hostEl,reponseData);
        mod.containers.response(hostEl,reponseData);
        break;
      case 'containerStop':
      case 'containerStart':
      case 'containerRestart':
        // mod.containers.populate(hostEl);
        mod.containers.request(hostEl);
        ui.notify(reponseData)
        break;
      case 'containerLog':
        modal.containerLog.load(reponseData['log'])
        break;
      case 'containerInspect':
        modal.containerInspect.load(reponseData['details'])
        break;
      case 'hostStats':
        // mod.hostStats.populate(hostEl,reponseData)
        mod.hostStats.response(hostEl,reponseData)
        break;
      case 'hostCpu':
        host.cpu.response(hostEl,reponseData)
        break;
      case 'hostMemory':
        host.memory.response(hostEl,reponseData)
        break;
      case 'volumes':
        modal.volumes.populate(reponseData)
        break;
      case 'images':
        modal.images.populate(reponseData)
        break;
      case 'pruneVolumes':
        ui.notify(reponseData)
        modal.volumes.load(hostEl)
        break;
      case 'pruneImages':
        ui.notify(reponseData)
        modal.images.load(hostEl)
        break;
      case 'hostHealth':
        host.health.response(hostEl,reponseData)
        break
    }
  }
});
