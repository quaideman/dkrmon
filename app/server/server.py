## Import required modules
from flask import Flask, render_template, request
from threading import Lock
from flask_socketio import SocketIO, send, emit
import socket,time,json,struct,os,sys,sqlite3,datetime,re,logging
from operator import itemgetter

# Set this variable to "threading", "eventlet" or "gevent" to test the
# different async modes, or leave it set to None for the application to choose
# the best option based on installed packages.
async_mode = None

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
# socketio = SocketIO(app)
socketio = SocketIO(app, async_mode=async_mode)
thread = None
thread_lock = Lock()

def log(tuple):
    ''' Log messages to the console/log '''
    now = str(datetime.datetime.today()).split('.')[0]
    print(now,tuple)

# def dbSetup():
#     """ Create the database if required and populate """
#     dbFile = 'dkrmon.db'
#     dbExists = os.path.isfile(dbFile)
#     def dbConnect(dbFile):
#         """ create a database connection to a SQLite database """
#         try:
#             conn = sqlite3.connect(dbFile)
#             return conn
#         except sqlite3.Error as e:
#             log(('ERR','dbConnect',e))
#             return None
#     def dbSeed(dbConn):
#         """ Create required tables etc """
#         sqlCreateAgentsTable = "CREATE TABLE IF NOT EXISTS agents (id INTEGER PRIMARY KEY,name text NOT NULL, ip text NOT NULL, port integer NOT NULL)"
#         try:
#             cur = dbConn.cursor()
#             cur.execute(sqlCreateAgentsTable)
#         except sqlite3.Error as e:
#             log(('ERR','dbSeed',e))
#     ## Create connection
#     if dbExists:
#         try:
#             dbConn = dbConnect(dbFile)
#             if dbConn is not None:
#                 return dbConn
#         except sqlite3.Error as e:
#             log(('ERR','dbSetup',e))
#     ## Assume its a new database
#     else:
#         # print('Database Does Not Exist. Seeding')
#         try:
#             dbConn = dbConnect(dbFile)
#             if dbConn is not None:
#                 dbSeed(dbConn)
#             return dbConn
#         except sqlite3.Error as e:
#             log(('ERR','dbSetup',e))

# def dbAgentGetAll():
#     """ Get all agents from database """
#     dbConn = dbSetup()
#     sql = "SELECT * FROM agents"
#     def cols(cursor):
#         cols = []
#         for col in cursor.description:
#             cols.append(col[0])
#         return cols
#     try:
#         cur = dbConn.cursor()
#         cur.execute(sql)
#         cols = cols(cur)
#         rows = cur.fetchall()
#         returnData = []
#         ## Create dict by combining cols and row items
#         for row in rows:
#             count = 0
#             newRow = {}
#             for item in row:
#                 newRow[cols[count]] = item
#                 count += 1
#             returnData.append(newRow)
#         return {'action':'dbAgentGet','result':'success','data': returnData}
#     except:
#         return {'action':'dbAgentGet','result':'error','message': 'Something went wrong'}
#     finally:
#         dbConn.close()

# def dbAgentAdd(agent):
#     """ Adds a new agent (name,ip,port) to the database """
#     def validate(agent):
#         if agent[0] and agent[1] and agent[2]:
#             name = True if re.match("^[A-Za-z0-9_\-\.\ ]+$", agent[0]) else False
#             return True if name else False
#         else:
#             return False
#
#     if validate(agent):
#         dbConn = dbSetup()
#         sql = "INSERT INTO agents(name,ip,port) VALUES(?,?,?)"
#         sqlCheck = "SELECT name FROM agents WHERE name=?"
#         try:
#             cur = dbConn.cursor()
#             name = [agent[0]]
#             cur.execute(sqlCheck, name)
#             row = cur.fetchall()
#             ## Check if already exists
#             if row:
#                 return {'action':'dbAgentAdd','result':'error','message':'Already exists'}
#             else:
#                 cur.execute(sql, agent)
#                 if cur.rowcount == 0:
#                     return {'action':'dbAgentAdd','result':'error','message':'{} rows effected'.format(cur.rowcount)}
#                 else:
#                     dbConn.commit()
#                     return {'action':'dbAgentAdd','result':'success','message': '{} rows effected'.format(cur.rowcount)}
#         except sqlite3.Error as e:
#             log(('ERR','dbAgentAdd',e))
#         except :
#             log(('ERR','dbAgentAdd','Something went wrong'))
#         finally:
#             dbConn.close()
#     else:
#         return {'action':'dbAgentAdd','result':'error','message': 'Values did not validate'}

# def dbAgentRemove(agent):
#     """ Removes agent from the database """
#     dbConn = dbSetup()
#     sql = "DELETE FROM agents WHERE name=?"
#     try:
#         cur = dbConn.cursor()
#         cur.execute(sql, agent)
#         if cur.rowcount == 0:
#             return {'action':'dbAgentRemove','result':'error','message':'{} rows effected'.format(cur.rowcount)}
#         else:
#             dbConn.commit()
#             return {'action':'dbAgentRemove','result':'success','message': '{} rows effected'.format(cur.rowcount)}
#     except:
#         return {'result':'error','message':'dbAgentRemove failed'}
#     finally:
#         dbConn.close()

# def agentRequest(agentDetails):
#     ''' Make requests to specified agents '''
#     def socketSnd(sock, msg):
#         ''' Prefix each message with a 4-byte length (network byte order) '''
#         msg = struct.pack('>I', len(msg)) + msg
#         sock.sendall(msg)
#     def socketRcv(sock):
#         ''' Read message length and unpack it into an integer '''
#         raw_msglen = socketRcvAll(sock, 4)
#         if not raw_msglen:
#             return None
#         msglen = struct.unpack('>I', raw_msglen)[0]
#         # Read the message data
#         return socketRcvAll(sock, msglen)
#     def socketRcvAll(sock, n):
#         ''' Helper function to recv n bytes or return None if EOF is hit '''
#         data = b''
#         while len(data) < n:
#             packet = sock.recv(n - len(data))
#             if not packet:
#                 return None
#             data += packet
#         return data
#     try:
#         agentSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
#         agentSocket.settimeout(1)
#         sndPayload = {'request' : agentDetails['request']}
#         sndPayload = json.dumps(sndPayload) # Serialse
#         sndPayload = sndPayload.encode() # Encode
#         port = int(agentDetails['port'])
#         agentSocket.connect((agentDetails['ip'], agentDetails['port']))
#         socketSnd(agentSocket, sndPayload)
#         rcvPayload = socketRcv(agentSocket)
#         rcvPayload = json.loads(rcvPayload)
#         rcvPayload['agentName'] = agentDetails['name']
#         rcvPayload['agentId'] = agentDetails['id']
#         return rcvPayload
#     except socket.error as e:
#         return {'action':'agentRequest','result':'error','agentId': agentDetails['id'],'message': os.strerror(e.errno)}
#     except:
#         return {'action':'agentRequest','result':'error','message': 'Failed to connect to agent'}
#     finally:
#         agentSocket.close()

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

## Websockets
# @socketio.on('agentRequest')
# def wsAgentRequest(agentDetails):
#     ''' Make an agent request '''
#     log(('INFO','Client request',str(agentDetails)))
#     returnData = agentRequest(agentDetails)
#     emit('agentRequest', returnData)
#
# @socketio.on('serverAgentAdd')
# def wsServerAgentAdd(json):
#     ''' Add a new agent to the database '''
#     log(('INFO','Client request',str(json)))
#     returnData = dbAgentAdd((json['name'],json['ip'],json['port']))
#     emit('serverAgentAdd', returnData)
#
# @socketio.on('serverAgentRemove')
# def wsServerAgentRemove(json):
#     ''' Remove agent from the database '''
#     log(('INFO','Client request',str(json)))
#     returnData = dbAgentRemove([json['host']])
#     emit('serverAgentRemove', returnData)
#
# @socketio.on('serverAgentGetAll')
# def wsServerAgentGetAll(json):
#     ''' Get all agents '''
#     log(('INFO','Client request',str(json)))
#     returnData = dbAgentGetAll()
#     emit('serverAgentGetAll', returnData)

### New stuff
def getData():
    ''' Return the requested data '''
    try:
        configFile = 'config.json'
        data = json.load(open(configFile,'r'))
        return data
    except:
        log(('ERR','getData','Unable to open',configFile))
        return False

def getDashboard(dashboardName=False):
    ''' Return requested dashboard if specified, otherwise return all dashboards '''
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
            hostSocket.settimeout(10) # Time to wait for response
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

# def dbAgentsGet(agents):
#     ''' Return a list of all agents that match the request '''
#     # agents = ','.join(map(str, agents))
#     agents = str(tuple(agents))
#     dbConn = dbSetup()
#     sql = 'SELECT * FROM agents where id in '+agents
#     def cols(cursor):
#         ''' Return list of column names '''
#         cols = []
#         for col in cursor.description:
#             cols.append(col[0])
#         return cols
#     try:
#         cur = dbConn.cursor()
#         cur.execute(sql)
#         cols = cols(cur)
#         rows = cur.fetchall()
#         returnData = []
#         ## Create dict by combining cols and row items
#         for row in rows:
#             count = 0
#             newRow = {}
#             for item in row:
#                 newRow[cols[count]] = item
#                 count += 1
#             returnData.append(newRow)
#         return returnData
#     except:
#         return False
#     finally:
#         dbConn.close()

# def agentRequest(request):
#     ''' Make requests against specified agents '''
#     agents = dbAgentsGet(request['data'])
#     def socketSnd(sock, msg):
#         ''' Prefix each message with a 4-byte length (network byte order) '''
#         msg = struct.pack('>I', len(msg)) + msg
#         sock.sendall(msg)
#     def socketRcv(sock):
#         ''' Read message length and unpack it into an integer '''
#         raw_msglen = socketRcvAll(sock, 4)
#         if not raw_msglen:
#             return None
#         msglen = struct.unpack('>I', raw_msglen)[0]
#         # Read the message data
#         return socketRcvAll(sock, msglen)
#     def socketRcvAll(sock, n):
#         ''' Helper function to recv n bytes or return None if EOF is hit '''
#         data = b''
#         while len(data) < n:
#             packet = sock.recv(n - len(data))
#             if not packet:
#                 return None
#             data += packet
#         return data
#     returnData = []
#     if agents:
#         for agent in agents:
#             try:
#                 agentSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
#                 agentSocket.settimeout(1)
#                 sndPayload = {'request' : request['request']}
#                 sndPayload = json.dumps(sndPayload) # Serialse
#                 sndPayload = sndPayload.encode() # Encode
#                 # port = int(agent['port'])
#                 agentSocket.connect((agent['ip'], agent['port']))
#                 socketSnd(agentSocket, sndPayload)
#                 rcvPayload = socketRcv(agentSocket)
#                 rcvPayload = json.loads(rcvPayload)
#                 # rcvPayload['agentName'] = agent['name']
#                 # rcvPayload['agentId'] = agent['id']
#                 rcvPayload['agentId'] = agent['id']
#                 # print(rcvPayload)
#                 returnData.append(rcvPayload)
#                 # return rcvPayload
#             except socket.error as e:
#                 returnData.append( {'action':'agentRequest','result':'error','message': os.strerror(e.errno),'agentId':agent['id']} )
#             except:
#                 returnData.append( {'action':'agentRequest','result':'error','message': 'Failed to connect to agent'} )
#             finally:
#                 agentSocket.close()
#         ## Return
#         return returnData
#     else:
#         return {'action':'agentRequest','result':'error','message': 'No agents'}

@socketio.on('serverRequest')
def serverRequest(request):
    ''' Client requests against this server '''
    log(('INFO','Client request',str(request)))
    returnData = hostRequest(request)
    emit('serverResponse', returnData)

### End New Stuff
# def PushDkrDetails():
#     """Example of how to send server generated events to clients."""
#     count = 0
#     while True:
#
#         count += 1
#         payload = []
#         for agent in dbAgentGetAll()['data']:
#             # agentDetails = {'request':'dkrDetails', 'id':agent['rowid'],'name':agent['name'],'ip':agent['ip'],'port':agent['port']}
#             agent['request'] = 'dkrDetails'
#             # print('AGENT##############',agent)
#             payload.append(agentRequest(agent))
#         socketio.emit('PushDkrDetails',payload)
#         socketio.sleep(10)

# @socketio.on('connect')
# def test_connect():
#     global thread
#     with thread_lock:
#         if thread is None:
#             thread = socketio.start_background_task(target=PushDkrDetails)

if __name__ == '__main__':
    socketio.run(app, debug=True)
