## Imports
from flask import Flask, render_template, request
from threading import Lock
from flask_socketio import SocketIO, send, emit
import socket,time,json,struct,os,sys,datetime,re,logging
from operator import itemgetter

## Setup
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

## Routes
@app.route('/')
def loadDefault():
    # agents = []
    ## Get just the agent names
    # for agent in dbAgentGetAll()['data']:
    #     agents.append(agent['name'])
    # return render_template('main.html', hosts=dbAgentGetAll()['data'])
    dashboards = getDashboard()
    return render_template('main.html', dashboards=dashboards, dashboard=dashboards[0]['name'], hosts=dashboards[0]['hosts'])
@app.route('/dashboard/<dashboard>')
def loadDashboard(dashboard):
    dashboards = getDashboard()
    dashboard = getDashboard(dashboard)
    return render_template('main.html', dashboards=dashboards, dashboard=dashboard['name'], hosts=dashboard['hosts'])

## Functions
def log(tuple):
    ''' Log messages to the console/log '''
    now = str(datetime.datetime.today()).split('.')[0]
    print(now,tuple)
def getDashboard(dashboardName=False):
    ''' Return requested dashboard if specified, otherwise return all dashboards '''
    def getData():
        ''' Return the requested data '''
        try:
            configFile = 'config.json'
            data = json.load(open(configFile,'r'))
            return data
        except:
            log(('ERR','getData','Unable to open',configFile))
            return False
    data = getData()
    if data:
        if dashboardName:
            for dashboard in data['dashboards']:
                if dashboard['name'] == dashboardName: return dashboard
        else:
            return data['dashboards']
def getHost(dashboardName,hostName):
    ''' Return requested host '''
    dashboard = getDashboard(dashboardName)
    if dashboard and hostName:
        for host in dashboard['hosts']:
            if host['name'] == hostName: return host
    else:
        return False
def hostRequest(request):
    ''' Make requests against specified hosts '''
    def socketSnd(sock, msg):
        ''' Prefix each message with a 4-byte length (network byte order) '''
        msg = struct.pack('>I', len(msg)) + msg
        sock.sendall(msg)
    def socketRcv(sock):
        ''' Read message length and unpack it into an integer '''
        raw_msglen = socketRcvAll(sock, 4)
        if not raw_msglen:
            return None
        msglen = struct.unpack('>I', raw_msglen)[0]
        # Read the message data
        return socketRcvAll(sock, msglen)
    def socketRcvAll(sock, n):
        ''' Helper function to recv n bytes or return None if EOF is hit '''
        data = b''
        while len(data) < n:
            packet = sock.recv(n - len(data))
            if not packet:
                return None
            data += packet
        return data
    def makeRequest(request,host):
        try:
            hostSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            hostSocket.settimeout(20) # Time to wait for response
            sndPayload = request
            sndPayload = json.dumps(sndPayload) # Serialse
            sndPayload = sndPayload.encode() # Encode
            hostSocket.connect( ( host['ip'], int(host['port']) ) )
            socketSnd(hostSocket, sndPayload) # Send
            rcvPayload = socketRcv(hostSocket) # Receive
            rcvPayload = json.loads(rcvPayload) # De-serialse
            rcvPayload['host'] = host['name']
            hostSocket.close()
            # log(('DEBUG','rcvPayload',rcvPayload))
            return rcvPayload
        except socket.error as e:
            request['result'] = 'error'
            result = request
            return result

    host = getHost(request['dashboard'],request['host'])
    if host:
        log(('DEBUG','makeRequest',request,host))
        return makeRequest(request,host)
    else:
        return {'action':'hostRequest','result':'error','message': 'No hosts'}

## Socket Requests
@socketio.on('serverRequest')
def serverRequest(request):
    ''' Client requests against this server '''
    log(('INFO','Client request',str(request)))
    returnData = hostRequest(request)
    emit('serverResponse', returnData)

## Flask
if __name__ == '__main__':
    socketio.run(app, debug=True)
