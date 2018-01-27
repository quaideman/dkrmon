// Global vars
var viewMode = "";
var selectedContainer = "";
var selectedImage = "";
var selectedVolume = "";
var volumesCurrentPage = 1;

// var currentLocation = window.location.pathname

function ModuleTaulator(mod,style) {
  this.mod = $('[data-mod='+mod+']');
  this.tableElement = this.mod.find('.table');
  this.params = function(){
    function tableOptions(tableElement){
      this.ajaxResponse = function(url, params, response){
        return response.data;
      };
      this.layout = 'fitColumns';
      this.placeholder = 'No data';
      this.height = '300px';
      this.renderComplete = function(data){
        tableElement.tablulator('redraw');
      }
    };
    switch ( this.mod.attr('data-mod') ) {
      case 'containers':
        var tableOptions = {}
        return '/containers/get'
        break;
      case 'volumes':
        return '/volumes/get'
        break;
      case 'images':
        return '/images/get'
        break;
    }
  };
  this.options = function(){

  };
  this.load = function(options,data){
    $.ajax({
      url: this.ajaxURL,
      success: function(data) {
        table.tabulator({
          //ajaxURL: '/images/get',
          ajaxResponse:function(url, params, response){
            // console.log(response);
            return response.data; //return the tableData peroperty of a response json object
          },
          layout: "fitColumns",
          //pagination: 'local',
          placeholder: "No Images",
          initialSort:[
            {column:"name", dir:"asc"},
          ],
          height:'300px',
          //pagination: 'local',
          //paginationSize:6,
          data: data.data,
          columns: [
            {title:"Name", field:"name"},
            {title:"Repo", field:"repo"},
            {title:"Tag", field:"tag"},
            {title:"Size", field:"size"},
            {title:"Created", field:"created"},
          ],
          renderComplete:function(data){
            mod.images.style();
          },
          rowClick:function(e, row) {
            selectedImage = row.getData().name
            console.log('selectedImage',selectedImage);
            $(e.currentTarget).addClass('selected').siblings().removeClass('selected');
          },
        });
      }
    })
  };
  this.refresh = function(){};
  this.style = function(){};
  this.resize = function(){};
  this.controls = function(){};
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
    elements : function() {
      var mod = $('[data-mod="containers"]')
      var table = mod.find('#table-all-containers');
      return {'mod':mod,'table':table};
    },
    load : function() {
      var table = this.elements()['table'];
      // Initialise
      table.tabulator({
        ajaxURL: '/containers/get',
        ajaxResponse:function(url, params, response){
          console.log(response);
          // Get totals
          var totalRunning = jQuery.grep(response.data, function( item ) {return item['status'] == 'running'}).length;
          var totalHealthy = jQuery.grep(response.data, function( item ) {return item['health'] == 'healthy'}).length;
          var totalExited = jQuery.grep(response.data, function( item ) {return item['status'] == 'exited'}).length;
          var totalStarting = jQuery.grep(response.data, function( item ) {return item['health'] == 'starting'}).length;
          var totalUnhealthy = jQuery.grep(response.data, function( item ) {return item['health'] == 'unhealthy'}).length;
          var total = response.data.length;
          // Set totals
          mod.containers.elements()['mod'].find('.mod-header [data-value="running"]').addClass('running').text("R: "+totalRunning).attr('title','Running Containers');
          mod.containers.elements()['mod'].find('.mod-header [data-value="healthy"]').addClass('healthy').text("H: "+totalHealthy).attr('title','Healthy Containers');
          mod.containers.elements()['mod'].find('.mod-header [data-value="unhealthy"]').addClass('unhealthy').text("U: "+totalUnhealthy).attr('title','Unhealthy Containers');
          mod.containers.elements()['mod'].find('.mod-header [data-value="exited"]').addClass('exited').text("E: "+totalExited).attr('title','Exited Containers');
          mod.containers.elements()['mod'].find('.mod-header [data-value="starting"]').addClass('starting').text("S: "+totalStarting).attr('title','Starting Containers');
          mod.containers.elements()['mod'].find('.mod-header [data-value="total"]').text("T: "+total).attr('title','Total Containers');
          // Return data to tabulator
          return response.data;
        },
        layout: "fitDataFill",
        height: '426px',
        placeholder: "No containers",
        initialSort:[
          {column:"name", dir:"asc"},
        ],
        pagination: 'local',
        tooltips:true,
        paginationSize: 10,
        tableBuilt : function(){
          mod.containers.controls();
        },
        columns: [
          {title:"Name", field:"name"},
          {title:"ID", field:"shortId"},
          {title:"Image", field:"image"},
          {title:"CMD", field:"cmd"},
          {title:"Ports", field:"ports"},
          {title:"Status", field:"status"},
          {title:"Health", field:"health"},
          {title:"Uptime", field:"uptime"},
          {title:"Memory", field:"memoryPct", formatter:function(cell, formatterParams){
            return '<div class="data-progress-wrap"><div class="data-progress-bar" style="width:'+cell.getValue()+'%"></div></div>'},
          },
        ],
        renderComplete:function(data){
          mod.containers.style();
        },
        rowClick:function(e, row) {
          selectedContainer = row.getData().shortId
          $(e.currentTarget).addClass('selected').siblings().removeClass('selected');
        },
      });
      // Populate
      this.refresh();
    },
    refresh : function(force){
      var thisTable = this.elements()['table'];
      var thisMod = this.elements()['mod'];
      if ( thisMod.attr('data-paused') == 'false' || force == 'force' ) {
        thisTable.tabulator("setData",'/containers/get');
      }
    },
    style : function(){
      var table = this.elements()['table'];
      // Set cell types
      var running = table.find('*').filter(function() { return $(this).text() === 'running';});
      var healthy = table.find('*').filter(function() {return $(this).text() === 'healthy';});
      var unhealthy = table.find('*').filter(function() {return $(this).text() === 'unhealthy';});
      var starting = table.find('*').filter(function() {return $(this).text() === 'starting';});
      var exited = table.find('*').filter(function() {return $(this).text() === 'exited';});
      // Set cell colours
      running.each(function(){$(this).removeClass().addClass('tabulator-cell running');})
      healthy.each(function(){$(this).removeClass().addClass('tabulator-cell healthy');})
      unhealthy.each(function(){$(this).removeClass().addClass('tabulator-cell unhealthy');})
      starting.each(function(){$(this).removeClass().addClass('tabulator-cell starting');})
      exited.each(function(){$(this).removeClass().addClass('tabulator-cell exited');})
      // Persist the container selected row
      if (selectedContainer) {
        table.find('.tabulator-cell:contains('+selectedContainer+')').parent().addClass('selected').siblings().removeClass('selected');
      }
    },
    resize : function() {
      var table = this.elements()['table'];
      if ( table.is(':visible') ) {
        table.tabulator("redraw");
      }
    },
    controls : function(){
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
    elements : function() {
      var mod = $('[data-mod="images"]')
      var table = mod.find('#table-all-images');
      return {'mod':mod,'table':table};
    },
    load : function() {
      var table = this.elements()['table'];
      // Initialse
      table.tabulator({
        ajaxURL: '/images/get',
        ajaxResponse:function(url, params, response){
          // console.log(response);
          // Summary
          totalRows = response.data.length
          mod.images.elements()['mod'].find('.mod-header [data-value="total"]').text("T: "+totalRows).attr('title','Total Images');
          // Return data to tabulator
          return response.data; //return the tableData peroperty of a response json object
        },
        layout: "fitDataFill",
        placeholder: "No Images",
        initialSort:[
          {column:"name", dir:"asc"},
        ],
        height:'300px',
        pagination: 'local',
        paginationSize:6,
        tooltips:true,
        tableBuilt:function(){
          mod.images.controls();
        },
        columns: [
          {title:"Name", field:"name"},
          {title:"Repo", field:"repo"},
          {title:"Tag", field:"tag"},
          {title:"Size", field:"size"},
          {title:"Created", field:"created"},
        ],
        renderComplete:function(){
          mod.images.style();
        },
        rowClick:function(e, row) {
          selectedImage = row.getData().name
          console.log('selectedImage',selectedImage);
          $(e.currentTarget).addClass('selected').siblings().removeClass('selected');
        },
      });
      // Populate
      this.refresh();
    },
    refresh : function(force){
      var thisTable = this.elements()['table'];
      var thisMod = this.elements()['mod'];
      if ( thisMod.attr('data-paused') == 'false' || force == 'force' ) {
        // console.log("Refreshing Images data");
        thisTable.tabulator("setData",'/images/get');
      }
    },
    style : function(){
      var thisTable = this.elements()['table'];
      // Persist the container selected row
      if (selectedImage) {
        thisTable.find('.tabulator-cell:contains('+selectedImage+')').parent().addClass('selected').siblings().removeClass('selected');
      }
    },
    resize : function() {
      var thisTable = this.elements()['table'];
      thisTable.tabulator("redraw");
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
    elements : function() {
      var mod = $('[data-mod="volumes"]')
      var table = mod.find('#table-all-volumes');
      return {'mod':mod,'table':table};
    },
    load : function() {
      var thisTable = this.elements()['table'];
      // Initialse table
      thisTable.tabulator({
        ajaxURL: '/volumes/get',
        ajaxResponse:function(url, params, response){
          // Summary
          totalRows = response.data.length
          mod.volumes.elements()['mod'].find('.mod-header [data-value="total"]').text("T: "+totalRows).attr('title','Total Volumes');;
          // Return data to tabulator
          return response.data;
        },
        layout: "fitDataFill",
        placeholder: "No Volumes",
        height: '300px',
        pagination: 'local',
        paginationSize: 6,
        tooltips:true,
        // data: data.data,
        initialSort:[
          {column:"name", dir:"asc"},
        ],
        pageLoaded:function(pageno){
        },
        columns: [
          {title:"Name", field:"name"},
          {title:"Created", field:"created"},
          {title:"Driver", field:"driver"},
          {title:"Mount", field:"mount"},
        ],
        tableBuilt:function(){
          mod.volumes.controls();
        },
        renderComplete:function(){
          mod.volumes.style();
        },
        rowClick:function(e, row) {
          selectedVolume = row.getData().name
          console.log('selectedVolume',selectedVolume);
          $(e.currentTarget).addClass('selected').siblings().removeClass('selected');
        },
      });
      // Populate table
      this.refresh();
    },
    refresh : function(force){
      var thisTable = this.elements()['table'];
      var thisMod = this.elements()['mod'];
      if ( thisMod.attr('data-paused') == 'false' || force == 'force' ) {
        // console.log("Refreshing Volumes data");
        thisTable.tabulator("setData",'/volumes/get');
      }
    },
    style : function(){
      var thisTable = this.elements()['table'];
      // Persist the container selected row
      if (selectedVolume) {
        thisTable.find('.tabulator-cell:contains('+selectedVolume+')').parent().addClass('selected').siblings().removeClass('selected');
      }
    },
    resize : function() {
      var thisTable = this.elements()['table'];
      thisTable.tabulator("redraw");
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

var modal = {
  containerLog : {
    element : function(){
      return $('#modal-container-log');
    },
    load : function(container){
      this.element().css('display','block')
      var modalBodyContent = this.element().find('.modal-body-content');
      // Populate header
      this.element().find('span.title').text("Container Log: "+container);
      // Activate close button
      var parentThis = this;
      this.element().find('[data-fn="closeModal"]').off().on('click',function(){
        parentThis.close();
      });
      // Initialise scrollbars if first load
      if (!modalBodyContent.hasClass('mCSB_container')) {
        modalBodyContent.mCustomScrollbar({
          axis:"yx",
          theme:"light-3",
          scrollInertia: 1,
        });
      }
      // Get data and populate
      $.ajax({
        url: '/container/log/'+container,
        success: function(data) {
          console.log(data);
          modalBodyContent = modalBodyContent.find('.mCSB_container')
          if (data.data[0]) {
            $.each(data.data,function(i,v){
              // Print line by line. Skip if empty
              if (v.length != 0) {modalBodyContent.append(v+'<br>');}
            })
          } else {
            modalBodyContent.append('Log Empty');
          }

        }
      })
    },
    close : function(){
      this.element().css('display','none');
      this.element().find('.mCSB_container').empty();
    },
  },
  containerTop : {
    element : function(){
      return $('#modal-container-top');
    },
    load : function(container){
      this.element().css('display','block')
      // Populate header
      this.element().find('span.title').text("Container Top: "+container);
      // Activate close button
      var parentThis = this;
      this.element().find('[data-fn="closeModal"]').off().on('click',function(){
        parentThis.close();
      });
      // Get data and populate
      $.ajax({
        url: '/container/top/'+container,
        success: function(data) {
          console.log(data);
          mod.containerTop.refresh(data.data);
        }
      })
    },
    close : function(){
      this.element().css('display','none');
    },
  },
  containerInspect : {
    element : function(){
      return $('#modal-container-inspect');
    },
    load : function(container){
      this.element().css('display','block')
      var modalBodyContent = this.element().find('.modal-body-content');
      // Populate header
      this.element().find('span.title').text("Container Inspect: "+container);
      // Activate close button
      var parentThis = this;
      this.element().find('[data-fn="closeModal"]').off().on('click',function(){
        parentThis.close();
      });
      // Initialise scrollbars if first load
      if (!modalBodyContent.hasClass('mCSB_container')) {
        modalBodyContent.mCustomScrollbar({
          axis:"yx",
          theme:"light-3",
          scrollInertia: 1,
        });
      }
      // Get data and populate
      $.ajax({
        url: '/container/inspect/'+container,
        success: function(data) {
          console.log(data);
          var jsonData = ui.jsonPretty(JSON.stringify(data.data,null,2));
          modalBodyContent.find('.mCSB_container').html('<pre><code>'+jsonData+'</code></pre>')
        }
      })
    },
    close : function(){
      this.element().css('display','none');
      this.element().find('.mCSB_container').empty();
    },
  },
  imageInspect : {
    element : function(){
      return $('#modal-image-inspect');
    },
    load : function(image){
      this.element().css('display','block')
      var modalBodyContent = this.element().find('.modal-body-content');
      // Populate header
      this.element().find('span.title').text("Image Inspect: "+image);
      // Activate close button
      var parentThis = this;
      this.element().find('[data-fn="closeModal"]').off().on('click',function(){
        parentThis.close();
      });
      // Initialise scrollbars if first load
      if (!modalBodyContent.hasClass('mCSB_container')) {
        modalBodyContent.mCustomScrollbar({
          axis:"yx",
          theme:"light-3",
          scrollInertia: 1,
        });
      }
      //Get data and populate
      $.ajax({
        url: '/image/inspect/'+image,
        success: function(data) {
          console.log(data);
          var jsonData = ui.jsonPretty(JSON.stringify(data.data,null,2))
          // Populate the mCSB container (scollbars)
          modalBodyContent.find('.mCSB_container').html('<pre><code>'+jsonData+'</code></pre>');
        }
      })
    },
    close : function(){
      this.element().css('display','none')
      this.element().find('.mCSB_container').empty();
    },
  },
  volumeInspect : {
    element : function(){
      return $('#modal-volume-inspect');
    },
    load : function(volume){
      this.element().css('display','block')
      var modalBodyContent = this.element().find('.modal-body-content');
      // Populate header
      this.element().find('span.title').text("Image Inspect: "+volume);
      // Activate close button
      var parentThis = this;
      this.element().find('[data-fn="closeModal"]').off().on('click',function(){
        parentThis.close();
      });
      // Initialise scrollbars if first load
      if (!modalBodyContent.hasClass('mCSB_container')) {
        modalBodyContent.mCustomScrollbar({
          axis:"yx",
          theme:"light-3",
          scrollInertia: 1,
        });
      }
      // Get data and populate
      $.ajax({
        url: '/volume/inspect/'+volume,
        success: function(data) {
          console.log(data);
          var jsonData = ui.jsonPretty(JSON.stringify(data.data,null,2))
          modalBodyContent.find('.mCSB_container').html('<pre><code>'+jsonData+'</code></pre>');
        }
      })
    },
    close : function(){
      this.element().css('display','none');
      this.element().find('.mCSB_container').empty();
    },
  },
}

var ui = {
  controls : {
    global : {
      modCollapse : function(){
        // Toggle module collpase
        $('.mod-wrap [data-type="collapse"]').on('click',function(){
          console.log();
          var state = $(this).parents('.mod-wrap').attr('data-collapsed');
          var badge = $(this);
          if ( state == 'false') {
            switch (viewMode) {
              case 'small':
              case 'medium':
                badge.attr('data-collapsed','true');
                break;
              case 'large':
                badge.parents('.w3-row').find('.mod-wrap').each(function(){
                  $(this).attr('data-collapsed','true');
                  $(this).find('.badge[data-type="collapse"] span').text('keyboard_arrow_down');
                })
                break;
            }
          } else {
            switch (viewMode) {
              case 'small':
              case 'medium':
                badge.attr('data-collapsed','false');
                break;
              case 'large':
                badge.parents('.w3-row').find('.mod-wrap').each(function(){
                  $(this).attr('data-collapsed','false');
                  $(this).find('.badge[data-type="collapse"] span').text('keyboard_arrow_up');
                })
                break;
            }

          }

        })
      },
      modPause : function(){
        // Module pause on content click
        $('.mod-content').on('click',function(){
          var state = $(this).parents('.mod-wrap').attr('data-paused');
          var badge = $(this).parents('.mod-wrap').find('.badge[data-type="pause"]');
          if (state == 'false') {
            badge.addClass('active');
            badge.parents('.mod-wrap').attr('data-paused','true');
          }
        })
        // Toggle module pause on badge click
        $('.mod-wrap [data-type="pause"]').on('click',function(){
          var state = $(this).parents('.mod-wrap').attr('data-paused');
          var badge = $(this);
          if (state == 'true') {
            badge.removeClass('active');
            badge.parents('.mod-wrap').attr('data-paused','false');
          } else {
            badge.addClass('active');
            badge.parents('.mod-wrap').attr('data-paused','true');
          }
        })
      },
    },
  },
  notify: function(result,message){
    // Prints a message in the message div
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
    element.clearQueue().html('<i class="icon material-icons md18">'+icon+'</i><span class="message">'+message+'</span>').removeClass('success error').addClass(addClass).fadeIn(200).delay(3000).fadeOut(200);
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
  viewMode: function(){
    var windowWidth = $(window).outerWidth()
    if ( windowWidth < 601 ) {
      viewMode = 'small';
    }
    if ( windowWidth >= 601 && windowWidth <= 992 ) {
      viewMode = 'medium';
    }
    if ( windowWidth > 992 ) {
      viewMode = 'large';
    }
  },
  defaults: function(){
    // Set defaults on load
    $('.mod-wrap').each(function(){
      $(this).attr('data-paused','false').attr('data-collapsed','false');
      $(this).find('.badge[data-type="collapse"] span').text('keyboard_arrow_up');
    })
  },
  load : function() {
    this.viewMode();
    this.defaults();
    this.controls.global.modCollapse();
    this.controls.global.modPause();
    mod.hostDetails.load();
    mod.hostMemory.load();
    mod.hostCpu.load();
    mod.hostStorage.load();
    mod.containerTop.load();
    mod.images.load();
    mod.volumes.load();
    mod.containers.load();
  },
  refresh : function() {
    mod.hostDetails.refresh();
    mod.hostMemory.refresh();
    mod.hostCpu.refresh();
    mod.hostStorage.refresh();
    mod.containers.refresh();
    mod.images.refresh();
    mod.volumes.refresh();
  },
  resize : function(){
    this.viewMode();
    mod.containers.resize();
    mod.images.resize();
    mod.volumes.resize();
  },
}

// Stuff to do on load
$(document).ready(function(){
  ui.load();
})

// Stuff to do on window resize
$(window).resize(function(){
  ui.resize();
});

// Stuff to do on interval
window.setInterval(function(){
  ui.refresh();
}, 10000);
