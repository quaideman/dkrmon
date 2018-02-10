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
  },
  viewMode: function(){
    var width = $(window).innerWidth();
    // if (width >= 1700) {return 'large'}
    if (width >= 1700) {return 'medium'}
    if (width < 1700 && width >= 1000) {return 'medium'}
    if (width < 1000 && width >= 600) {return 'small'}
    if (width < 600) {return 'xsmall'}
  },
  notify: function(result,message){
    // Displays a notification
    var element = $('#notify');
    switch(result) {
      case "success":
        var addClass = "success";
        var icon = "check_circle"
        break;
      case "error":
        var addClass = "error";
        var icon = "error_outline"
        break;
    }
    element.clearQueue()
      .html('<i class="icon material-icons md18">'+icon+'</i><span class="message">'+message+'</span>')
      .removeClass('success error').addClass(addClass).fadeIn(200).delay(3000).fadeOut(200);
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
        $(this).find('.mod').attr('data-collapsed','true');
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
    // Manage agents
    $('button[data-fn="dashboardSettings"]').click(function(){
      console.log('settings')
      modal.display($('[data-modal="dashboard-settings"]'))
    })
    // Save dashboard layout
    $('button[data-fn="dashboardSaveLayout"]').click(function(){
      ui.notify('success','Saved');
    })
  },
  host: function(){
    // Collapse host
    $('.host button[data-fn="collapseHost"]').click(function(){
      $(this).parents('.host').find('.mod').each(function(){
        $(this).attr('data-collapsed','true');
        $(this).find('[data-fn="toggleCollapse"] .icn').text('expand_more');
      })
    })
    // Expand host
    $('.host button[data-fn="expandHost"]').click(function(){
      $(this).parents('.host').find('.mod').each(function(){
        $(this).attr('data-collapsed','false');
        $(this).find('[data-fn="toggleCollapse"] .icn').text('expand_less');
      })
    })
    // Pause host
    $('.host button[data-fn="pauseHost"]').click(function(){
      var mods = $(this).parents('.host').find('.mod');
      mods.each(function(){
        $(this).attr('data-paused','true');
      })
    })
    // Resume host
    $('.host button[data-fn="resumeHost"]').click(function(){
      var mods = $(this).parents('.host').find('.mod');
      mods.each(function(){
        $(this).attr('data-paused','false');
      })
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

function buildTable(table,data,columns,pageLimit){
  function cellFormat(key,data){
    //  Formats table data cells when they contain objects
    // console.log(key,data);
    // Is there valid obects
    if (data.length > 0) {
      switch (key) {
        case 'Ports':
          // Iterate over X number of ports
          returnData = ""
          $.each(data,function(i,v){
            returnData += v['IP']+':'+v['PublicPort']+':'+v['PrivatePort']+'/'+v['Type']
          })
          break;
        case 'Names':
          // Iterate over X number of names
          returnData = ""
          $.each(data,function(i,v){
            returnData += v
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
        if ($.type(v) == "array") {
          var value = cellFormat(i,v);
          var cell = '<div class="cell" data-page="'+pageCount+'" data-row="'+rowCount+'" data-column="'+i+'" title="'+value+'">'+value+'</div>'
        } else {
          var cell = '<div class="cell" data-page="'+pageCount+'" data-row="'+rowCount+'" data-column="'+i+'" title="'+v+'">'+v+'</div>'
        }
        // Append the created cell to the table DOM
        table.append(cell)
      }
    })
    rowCount += 1;
    if (rowCount == pageLimit+1) {pageCount += 1; rowCount=0}
  })
  // Add row hover
  table.find('.cell').hover(function(){
    var row = $(this).attr('data-row');
    var page = $(this).attr('data-page');
    $(this).toggleClass('hovered').siblings('[data-row="'+row+'"][data-page="'+page+'"]').toggleClass('hovered');
  })
}

// Modules
var mod = {
  hostDetails : {
    element : function(){
      return $('[data-mod="hostDetails"]')
    },
    load : function(){
      var element = this.element();
      $.ajax({
        url: '/host/info/details',
        success: function(data) {
          element.find('[data-value="hostname"]').text(data.data.Name)
          element.find('[data-value="operatingSystem"]').text(data.data.OperatingSystem)
          element.find('[data-value="kernelVersion"]').text(data.data.KernelVersion)
          element.find('[data-value="swarm"]').text(data.data.Swarm.ControlAvailable)
          element.find('.mod-header .title').text(data.data.Name)
        }
      });
    },
    refresh : function(){
      this.load()
    },
  },
  hostCpu : {
    element : function(){
      return $('[data-mod="hostCpu"]')
    },
    load : function(){
      var element = this.element();
      $.ajax({
        url: '/host/info/cpu',
        success: function(data) {
          // console.log(data);
          if (data.data.avg5Pct >= 0 && data.data.avg5Pct <= 25) {var state = "low"}
          if (data.data.avg5Pct >= 26 && data.data.avg5Pct <= 75) {var state = "mid"}
          if (data.data.avg5Pct >= 76) {var state = "high"}
          element.find('[data-value="pct"]').text(data.data.avg1Pct+"%").removeClass('low mid high').addClass(state)
          element.find('[data-value="pctBar"]').css('width',data.data.avg1Pct+"%").removeClass('low mid high').addClass(state)
          element.find('[data-value="avg1"]').text(data.data.avg1)
          element.find('[data-value="avg5"]').text(data.data.avg5)
          element.find('[data-value="avg15"]').text(data.data.avg15)
        }
      });
    },
    refresh : function(){
      this.load()
    },
  },
  hostMemory : {
    element : function(){
      return $('[data-mod="hostMemory"]')
    },
    load : function(){
      var element = this.element();
      $.ajax({
        url: '/host/info/memory',
        success: function(data) {
          // console.log(data);
          if (data.data.memUsagePct >= 0 && data.data.memUsagePct <= 50) {var state = "low"}
          if (data.data.memUsagePct >= 51 && data.data.memUsagePct <= 80) {var state = "mid"}
          if (data.data.memUsagePct >= 81) {var state = "high"}
          element.find('[data-value="pct"]').text(data.data.memUsagePct+"%").removeClass('low mid high').addClass(state)
          element.find('[data-value="pctBar"]').css('width',data.data.memUsagePct+"%").removeClass('low mid high').addClass(state)
          element.find('[data-value="total"]').text(data.data.memTotal+" MB")
          element.find('[data-value="available"]').text(data.data.memAvailable+" MB")
          element.find('[data-value="free"]').text(data.data.memFree+" MB")
          element.find('[data-value="usage"]').text(data.data.memUsage+" MB")
        }
      });
    },
    refresh : function(){
      this.load()
    },
  },
  hostStorage : {
    element : function(){
      return $('[data-mod="hostStorage"]')
    },
    load : function(){
      var element = this.element();
      $.ajax({
        url: '/host/info/storage',
        success: function(data) {
          // console.log(data);
          if (data.data.usagePct >= 0 && data.data.usagePct <= 50) {var state = "low"}
          if (data.data.usagePct >= 51 && data.data.usagePct <= 80) {var state = "mid"}
          if (data.data.usagePct >= 81) {var state = "high"}
          element.find('[data-value="pct"]').text(data.data.usagePct+'%').removeClass('low mid high').addClass(state)
          element.find('[data-value="pctBar"]').css('width',data.data.usagePct+"%").removeClass('low mid high').addClass(state)
          element.find('[data-value="driver"]').text(data.data.driver)
          element.find('[data-value="size"]').text(data.data.size+" MB")
          element.find('[data-value="usage"]').text(data.data.usage+" MB")
          element.find('[data-value="avail"]').text(data.data.avail+" MB")
        }
      });
    },
    refresh : function(){
      this.load()
    },
  },
  containers : {
    load: function() {
      // Stuff to do on initial load. Just once
      $('.host [data-mod="containers"]').each(function(){
        var thisDashboard = $('.dashboard').attr('data-dashboard');
        var thisHost = $(this).parents('.host');
        var thisMod = $(this);
        var table = thisMod.find('[data-table]');
        var currentPageBadge = thisMod.find('[data-value="currentPage"]');
        // Pagination
        thisMod.find('[data-fn="nextPage"]').click(function(){
          var currentPage = parseInt(currentPageBadge.text());
          var nextPage = currentPage + 1;
          // Load next page if exists
          if ( table.find('.cell[data-page="'+nextPage+'"]').length > 0 ) {
            currentPageBadge.text(nextPage)
            table.find('.cell[data-page="'+currentPage+'"]').hide();
            table.find('.cell[data-page="'+nextPage+'"]').show();
          }
        })
        thisMod.find('[data-fn="previousPage"]').click(function(){
          var currentPage = parseInt(currentPageBadge.text());
          // Load previous page if it exists
          if (currentPage > 1) {
            var prevPage = currentPage - 1;
            currentPageBadge.text(prevPage)
            table.find('.cell[data-page="'+currentPage+'"]').hide();
            table.find('.cell[data-page="'+prevPage+'"]').show();
          }
        })
        // Filter handler
        var filterDelay;
        thisMod.find('[data-fn="filterTable"]').keydown(function(){
          var thisEl = $(this)
          clearTimeout(filterDelay);
          filterDelay = setTimeout(function(){
            var query = thisEl.val();
            mod.containers.filter(query,table);
          }, 300);
        })
        // Attach events to control buttons
        thisMod.find('[data-fn^="container"]').click(function(){
          var thisFn = $(this).attr('data-fn')
          // var thisHost = $(this).parents('.host');
          // Get selected containers
          var selectedCells = table.children('.cell.selected[data-column="Id"]');
          var selectedContainers = []
          selectedCells.each(function(){
            selectedContainers.push($(this).text());
          })
          // Make request
          thisMod.attr('data-paused','false')
          serverRequest({'request': thisFn, 'dashboard': $('.dashboard').attr('data-dashboard'), 'host': thisHost.attr('data-host'),'containers': selectedContainers})
        })
        // Make request for data
        serverRequest({'request': 'containers', 'dashboard': thisDashboard, 'host': thisHost.attr('data-host')});
      })
    },
    populate: function(thisHost,data){
      var thisDashboard = $('.dashboard').attr('data-dashboard');
      var thisMod = thisHost.find('[data-mod="containers"]');
      var thisSection = thisMod.find('section');
      var table = thisSection.find('[data-table]');
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
            var columns = ['Id','Names','Command','Created','Image','Names','Ports','State','Status'];
            // Disable container buttons
            thisMod.find('footer .footer-controls [data-fn^="container"]').prop('disabled', true);
            // Populate table with data
            buildTable(table,data['data'],columns,10)
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
            table.find('.cell[data-column="State"]').each(function(){
              if ($(this).text().indexOf('exited') >= 0) {$(this).addClass('exited')}
              if ($(this).text().indexOf('running') >= 0) {$(this).addClass('running')}
            })
            table.find('.cell[data-column="Status"]').each(function(){
              if ($(this).text().indexOf('healthy') >= 0) {$(this).addClass('healthy')}
              if ($(this).text().indexOf('unhealthy') >= 0) {$(this).addClass('unhealthy')}
              if ($(this).text().indexOf('Exited') >= 0) {$(this).addClass('exited')}
            })
            // If page not set, deafult to 1
            var currentPage = thisMod.find('[data-value="currentPage"]').text();
            if ( ! currentPage ) {
              thisMod.find('[data-value="currentPage"]').text(1);
              table.find('.cell[data-page="1"]').show();
            } else {
              thisMod.find('[data-value="currentPage"]').text(parseInt(currentPage));
              table.find('.cell[data-page="'+parseInt(currentPage)+'"]').show();
            }
            // Apply any filters that may be applied
            var tableFilter = table.attr('data-filter');
            if ( tableFilter ) {
              mod.containers.filter(tableFilter,table)
            }
            // Row select
            table.find('.cell').click(function(){
              var row = $(this).attr('data-row');
              var page = $(this).attr('data-page');
              $(this).toggleClass('selected').siblings('[data-row="'+row+'"][data-page="'+page+'"]').toggleClass('selected');
              var selectedCells = table.children('.cell.selected[data-column="Id"]');
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
          table.text('Unable to connect to host').css('grid-template-columns','auto');
          // Disable container buttons
          thisMod.find('footer .footer-controls [data-fn^="container"]').prop('disabled', true);
        }
      }
    },
    filter: function(query,table){
      // Apply Filtering
      // console.log(query,query.length);
      if ( query.length > 0 ) {
        // Set the current filter so populate can check
        table.attr('data-filter',query);
        // Get the rows that match query
        var rows = []
        table.find('.cell').each(function(){
          if ($(this).text().indexOf(query) >= 0) {
            rows.push($(this).attr('data-row'));
          }
        })
        // Hide all rows that are not in rows
        if ( rows.length > 0 ) {
          table.find('.cell').each(function(){
            if ( $.inArray( $(this).attr('data-row'), rows) > -1 ) {
              $(this).show()
            } else {
              $(this).hide()
            }
          })
        }
      } else {
        table.removeAttr('data-filter');
        table.find('.cell').each(function(){
          $(this).show();
        })
      }
    },
    load2 : function() {
      // Initialse all containers tables
      $('[data-table="containers"]').each(function(){
        // Initialse Table
        $(this).tabulator({
          // layout: "fitDataFill",
          layout: "fitColumns",
          height: '400px',
          placeholder: "No containers",
          initialSort:[{column:"Names", dir:"asc"}],
          pagination: 'local',
          tooltips: true,
          paginationSize: 10,
          columns: [
            {title:"ID", field:"Id",headerFilter:true},
            {title:"Image", field:"Image",headerFilter:true},
            {title:"Command", field:"Command",headerFilter:true},
            {title:"Created", field:"Created",headerFilter:true},
            {title:"State", field:"State",headerFilter:true,
              formatter:function(cell, formatterParams){
                str = cell.getValue();
                cellEl = cell.getElement()
                if (str.indexOf('exited') >= 0) {cellEl.addClass('exited')}
                if (str.indexOf('running') >= 0) {cellEl.addClass('healthy')}
                return str
              },
            },
            {title:"Status", field:"Status",headerFilter:true,
              formatter:function(cell, formatterParams){
                str = cell.getValue();
                cellEl = cell.getElement()
                if (str.indexOf('(unhealthy)') >= 0) {cellEl.addClass('unhealthy')}
                if (str.indexOf('(healthy)') >= 0) {cellEl.addClass('healthy')}
                if (str.indexOf('Exited') >= 0) {cellEl.addClass('exited')}
                return str
              },
            },
            {title:"Ports", field:"Ports",headerFilter:true,
              mutator:function(value, data, type, mutatorParams, cell){
                returnData = ""
                if (value.length >= 1) {
                  $.each(value,function(i,v){
                    returnData += v['IP']+':'+v['PublicPort']+':'+v['PrivatePort']+'/'+v['Type']
                  })
                  return returnData
                } else {
                  return 'NA'
                }
              },
            },
            {title:"Names", field:"Names",headerFilter:true},
          ],
          renderComplete:function(data){
            // mod.containers.style();
          },
          rowClick:function(e, row) {
            // selectedContainer = row.getData().shortId
            // $(e.currentTarget).addClass('selected').siblings().removeClass('selected');
          },
        })
      })
    },
    populate2 : function(hostId,data){
      var host = $('[data-hostId="'+hostId+'"]');
      var table = host.find('[data-table="containers"]');
      // Populate table data if it is not paused
      if (table.parents('.mod').attr('data-paused') == 'false') {
        table.tabulator("setData",data);
      }
      // Update badges
      countTotal = data.length;
      countRunning = 0
      countExited = 0
      countHealthy = 0
      countUnhealthy = 0
      countStarting = 0
      $.each(data,function(i,v){
        if (v['State'].indexOf('running') >= 0) {countRunning += 1};
        if (v['State'].indexOf('exited') >= 0) {countExited += 1};
        if (v['State'].indexOf('starting') >= 0) {countStarting += 1};
        if (v['Status'].indexOf('(healthy)') >= 0) {countHealthy += 1};
        if (v['Status'].indexOf('(unhealthy)') >= 0) {countUnhealthy += 1};
      })
      table.parents('.mod').find('.header-controls [data-value="total"]').attr('title','Total').text('T:'+countTotal);
      table.parents('.mod').find('.header-controls [data-value="running"]').attr('title','Running').text('R:'+countRunning).addClass('running');
      table.parents('.mod').find('.header-controls [data-value="exited"]').attr('title','Exited').text('E:'+countExited).addClass('exited');
      table.parents('.mod').find('.header-controls [data-value="starting"]').attr('title','Starting').text('S:'+countStarting).addClass('starting');
      table.parents('.mod').find('.header-controls [data-value="healthy"]').attr('title','Healthy').text('H:'+countHealthy).addClass('healthy');
      table.parents('.mod').find('.header-controls [data-value="unhealthy"]').attr('title','Unhealthy').text('U:'+countUnhealthy).addClass('unhealthy');

    },
    style2 : function(table){
      // Persist the container selected row
      if (selectedContainer) {
        table.find('.tabulator-cell:contains('+selectedContainer+')').parent().addClass('selected').siblings().removeClass('selected');
      }
    },
    controls: function(){

    },
    controls2 : function(){
      var thisMod = this.elements()['mod']
      // Set active nav button
      $('#nav [data-nav="containers"]').addClass('selected').siblings().removeClass('selected');
      // Enable container control buttons
      $('button[data-group="container"]').off().on('click',function(){
        switch ( $(this).attr('data-fn') ) {
          case 'stop':
            console.log('Stopping container:',selectedContainer);
            $.ajax({
              url: '/container/stop/'+selectedContainer,
              success: function(data) {
                console.log(data);
                mod.containers.refresh('force');
                ui.notify(data.result,data.message);
              }
            })
            break;
          case 'start':
            console.log('Starting container:',selectedContainer);
            $.ajax({
              url: '/container/start/'+selectedContainer,
              success: function(data) {
                console.log(data);
                mod.containers.refresh('force');
                ui.notify(data.result,data.message);
              }
            })
            break;
          case 'restart':
           console.log('Restarting container:',selectedContainer);
            $.ajax({
              url: '/container/restart/'+selectedContainer,
              success: function(data) {
                console.log(data);
                mod.containers.refresh('force');
                ui.notify(data.result,data.message);
              }
            })
            break;
          case 'log':
            modal.containerLog.load(selectedContainer)
            break;
          case 'top':
            modal.containerTop.load(selectedContainer)
            break;
          case 'inspect':
            modal.containerInspect.load(selectedContainer)
            break;
          case 'remove':
            if ( $(this).children('.content').text() == 'Remove' ) {
              // Confirm
              $(this).children('.content').text('Confirm');
              setTimeout(function(target){
                target.children('.content').text('Remove');
              }, 3000, $(this));
            } else if ( $(this).children('.content').text() == 'Confirm' ) {
              // Remove
              $.ajax({
                url: '/container/remove/'+selectedContainer,
                success: function(data) {
                  mod.containers.refresh('force');
                  ui.notify(data.result,data.message);
                }
              })
              $(this).children('.content').text('Remove');
            }
            break;
          }
      });
    },
  },
  containerTop : {
    element : function() {
      return $("#table-container-top");
    },
    load : function() {
      this.element().tabulator({
        height: 300,
        layout: "fitDataFill",
        selectable: false,
        columns: [
          {title:"UID", field:"uid"},
          {title:"PID", field:"pid"},
          {title:"PPID", field:"ppid"},
          {title:"C", field:"c"},
          {title:"STIME", field:"stime"},
          {title:"TTY", field:"tty"},
          {title:"TIME", field:"time"},
          {title:"CMD", field:"cmd"},
        ],
      });
    },
    style : function() {},
    refresh : function(data) {
      this.element().tabulator("setData",data);
    },
    resize : function() {},
  },
  images : {
    load : function() {
      // Initialse all containers tables
      $('[data-table="images"]').each(function(){
        // Initialse Table
        $(this).tabulator({
          // layout: "fitDataFill",
          layout: "fitColumns",
          height: '400px',
          placeholder: "No Images",
          initialSort:[{column:"Labels", dir:"asc"}],
          pagination: 'local',
          tooltips: true,
          paginationSize: 10,
          columns: [
            {title:"Containers", field:"Containers",headerFilter:true},
            {title:"Created", field:"Created",headerFilter:true},
            {title:"ID", field:"Id",headerFilter:true},
            {title:"Labels", field:"Labels",headerFilter:true,
              mutator:function(value){
                returnData = ""
                if (value) {
                  $.each(value,function(i,v){
                    returnData += i+':'+v
                  })
                  return returnData
                } else {
                  return 'NA'
                }
              },
            },
            {title:"Tags", field:"RepoTags",headerFilter:true},
            {title:"Size", field:"Size",headerFilter:true},
          ],
          // data: data['Containers'],
          renderComplete:function(data){
            // mod.containers.style();
          },
          rowClick:function(e, row) {
            // selectedContainer = row.getData().shortId
            // $(e.currentTarget).addClass('selected').siblings().removeClass('selected');
          },
        })
      })
    },
    populate : function(hostId,data){
      var host = $('[data-hostId="'+hostId+'"]');
      var table = host.find('[data-table="images"]');
      // Populate table data if it is not paused
      if (table.parents('.mod').attr('data-paused') == 'false') {
        table.tabulator("setData",data);
      }
      // Update badges
      countTotal = data.length;
      table.parents('.mod').find('.header-controls [data-value="total"]').attr('title','Total').text('T:'+countTotal);
    },
    style : function(){
      var thisTable = this.elements()['table'];
      // Persist the container selected row
      if (selectedImage) {
        thisTable.find('.tabulator-cell:contains('+selectedImage+')').parent().addClass('selected').siblings().removeClass('selected');
      }
    },
    controls : function(){
      // Set active nav button
      $('#nav [data-nav="images"]').addClass('selected').siblings().removeClass('selected');
      // Control buttons
      $('button[data-group="image"]').off().on('click',function(){
        switch ( $(this).attr('data-fn') ) {
          case 'prune':
            console.log('Pruning images');
            $.ajax({
              url: '/images/prune',
              success: function(data) {
                console.log(data);
                mod.images.refresh();
                ui.notify(data.result,data.message);
              }
            })
            break;
          case 'inspect':
            modal.imageInspect.load(selectedImage)
            break;
          case 'remove':
            if ( $(this).children('.content').text() == 'Remove' ) {
              // Confirm
              $(this).children('.content').text('Confirm');
              setTimeout(function(target){
                target.children('.content').text('Remove');
              }, 3000, $(this));
            } else if ( $(this).children('.content').text() == 'Confirm' ) {
              // Remove
              $.ajax({
                url: '/image/remove/'+selectedImage,
                success: function(data) {
                  mod.images.refresh('force');
                  ui.notify(data.result,data.message);
                }
              })
              $(this).children('.content').text('Remove');
            }
            break;
          }
      });
    },
  },
  volumes : {
    load : function() {
      // Initialse all containers tables
      $('[data-table="volumes"]').each(function(){
        // Initialse Table
        $(this).tabulator({
          // layout: "fitDataFill",
          layout: "fitColumns",
          height: '400px',
          placeholder: "No Volumes",
          initialSort:[{column:"Name", dir:"asc"}],
          pagination: 'local',
          tooltips: true,
          paginationSize: 10,
          columns: [
            {title:"Created", field:"CreatedAt",headerFilter:true},
            {title:"Driver", field:"Driver",headerFilter:true},
            {title:"Labels", field:"Labels",headerFilter:true,
              mutator:function(value){
                returnData = ""
                if (value.length >= 1) {
                  $.each(value,function(i,v){
                    // returnData += v['IP']+':'+v['PublicPort']+':'+v['PrivatePort']+'/'+v['Type']
                  })
                  return returnData
                } else {
                  return 'NA'
                }
              },
            },
            {title:"Mountpoint", field:"Mountpoint",headerFilter:true,
              mutator:function(value){
                returnData = ""
                if (value) {
                  returnData = value;
                  return returnData
                } else {
                  return 'NA'
                }
              },
            },
            {title:"Name", field:"Name",headerFilter:true},
          ],
          // data: data['Containers'],
          renderComplete:function(data){
            // mod.containers.style();
          },
          rowClick:function(e, row) {
            // selectedContainer = row.getData().shortId
            // $(e.currentTarget).addClass('selected').siblings().removeClass('selected');
          },
        })
      })
    },
    populate : function(hostId,data){
      var host = $('[data-hostId="'+hostId+'"]');
      var table = host.find('[data-table="volumes"]');
      // Populate table data if it is not paused
      if (table.parents('.mod').attr('data-paused') == 'false') {
        table.tabulator("setData",data);
      }
      // Update badges
      countTotal = data.length;
      table.parents('.mod').find('.header-controls [data-value="total"]').attr('title','Total').text('T:'+countTotal);
    },
    style : function(){
      var thisTable = this.elements()['table'];
      // Persist the container selected row
      if (selectedVolume) {
        thisTable.find('.tabulator-cell:contains('+selectedVolume+')').parent().addClass('selected').siblings().removeClass('selected');
      }
    },
    controls : function(){
      // Set active nav button
      $('#nav [data-nav="volumes"]').addClass('selected').siblings().removeClass('selected');
      // Control buttons
      $('button[data-group="volume"]').off().on('click',function(){
        switch ( $(this).attr('data-fn') ) {
          case 'prune':
            console.log('Pruning Volumes');
            $.ajax({
              url: '/volumes/prune',
              success: function(data) {
                console.log(data);
                mod.volumes.refresh();
                ui.notify(data.result,data.message);
              }
            })
            break;
          case 'inspect':
            modal.volumeInspect.load(selectedVolume)
            break;
          case 'remove':
            if ( $(this).children('.content').text() == 'Remove' ) {
              // Confirm
              $(this).children('.content').text('Confirm');
              setTimeout(function(target){
                target.children('.content').text('Remove');
              }, 3000, $(this));
            } else if ( $(this).children('.content').text() == 'Confirm' ) {
              // Remove
              $.ajax({
                url: '/volume/remove/'+selectedVolume,
                success: function(data) {
                  mod.volumes.refresh('force');
                  ui.notify(data.result,data.message);
                }
              })
              $(this).children('.content').text('Remove');
            }
            break;
          }
      });
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
  },
}

// Stuff to run on load
$(document).ready(function(){
  ui.defaults()
  dashboardControls.load()
  mod.containers.load();
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
  })
}, 10000);

// Server Requests
function serverRequest(request){
  console.log('serverRequest',request);
  socket.emit('serverRequest', request);
}

// Server Responses
socket.on('serverResponse', function(data) {
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
      break;
  }

});
