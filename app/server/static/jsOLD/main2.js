$(document).ready(function(){
  var socket = io.connect('http://' + document.domain + ':' + location.port);
  var selectedHost = ""
  var selectedPort = 0

  // Messages to server
  socket.on('connect', function() {
      socket.emit('clientConnected', {data: 'I\'m connected!'});
  });

  // Get agents
  $('[data-fn="getAgents"]').click(function(){
    socket.emit('serverAgentGet',{'request':'serverAgentGet'});
  })

  // Get status
  $('[data-fn="status"]').click(function(){
    socket.emit('agentRequest', {'request':'status','agent':selectedHost,'port':selectedPort});
  })

  // Get dkrDetails
  $('[data-fn="dkrDetails"]').click(function(){
    socket.emit('agentRequest', {'request':'dkrDetails','agent':selectedHost,'port':selectedPort});
  })

  // Add agent
  $('[data-fn="serverAgentAdd"]').click(function(){
    console.log('Adding agent');
    host = $('input[name="host"]').val()
    port = parseInt($('input[name="port"]').val())
    socket.emit('serverAgentAdd', {'request':'agentAdd','host':host,'port':port});
  })

  // Add agent
  $('[data-fn="serverAgentRemove"]').click(function(){
    console.log('Removing agent');
    socket.emit('serverAgentRemove', {'request':'agentRemove','host':selectedHost});
  })

  // Messages from server
  socket.on('serverAgentGet', function (data) {
    console.log(data);
    $('#agents').empty()
    $.each(data.data,function(i,v){
      host = v[0];
      port = v[1];
      $('#agents').append('<p>'+host+':'+port+'</p>')
    })
    $('#agents p').click(function(e){
      selectedHost = $(this).text().split(":")[0]
      selectedPort = $(this).text().split(":")[1]
      $(this).siblings().css('color','black')
      $(this).css('color','red')
      console.log(selectedHost,selectedPort);
    })
  });

  socket.on('serverAgentRemove', function (data) {
    console.log(data);
  });

  socket.on('agentRequest', function (data) {
    console.log(data);
  });

  socket.on('serverAgentAdd', function (data) {
    console.log(data);
  });
})
