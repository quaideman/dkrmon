import socket,json,struct,docker,os,sys,datetime

def log(tuple):
    ''' Log messages to the console/log '''
    now = str(datetime.datetime.today()).split('.')[0]
    print(now,tuple)

def startAgent():
    """ Start the agent  """
    def socketSnd(sock, msg):
        # Prefix each message with a 4-byte length (network byte order)
        msg = struct.pack('>I', len(msg)) + msg
        sock.sendall(msg)
    def socketRcv(sock):
        # Read message length and unpack it into an integer
        raw_msglen = SocketRcvAll(sock, 4)
        if not raw_msglen:
            return None
        msglen = struct.unpack('>I', raw_msglen)[0]
        # Read the message data
        return SocketRcvAll(sock, msglen)
    def SocketRcvAll(sock, n):
        # Helper function to recv n bytes or return None if EOF is hit
        data = b''
        while len(data) < n:
            packet = sock.recv(n - len(data))
            if not packet:
                return None
            data += packet
        return data
    interface = "0.0.0.0"
    port=5000 if not os.environ.get('DKRMON_PORT') else int(os.environ.get('DKRMON_PORT'))
    try:
        ## Create a socket object
        serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        serversocket.bind((interface, port)) # Bind
        serversocket.listen(2) # queue up to 2 requests
        log(('INFO','Started agent on',interface,port))
        while True:
            try:
                # Establish a connection
                clientsocket,addr = serversocket.accept()
                rcvPayload = socketRcv(clientsocket)
                rcvPayload = json.loads(rcvPayload)
                log(('INFO','Request received',rcvPayload))
                sndPayload = myRequests(rcvPayload)
                sndPayload = json.dumps(sndPayload)
                sndPayload = sndPayload.encode()
                # log(('====DEBUG====','sndPayload',sndPayload))
                socketSnd(clientsocket, sndPayload)
            except:
                log(('ERR','Agent exited abnormally'))
                sys.exit(1)
            finally:
                clientsocket.close()
    except:
        log(('ERR','Agent failed to start or exited abnormally'))

def myRequests(rcvPayload):
    ''' Request handlers for requests made against this agent '''
    def dkrDetails(resource):
        returnData = dkrClient.df()
        return returnData[resource]
    ## Switch the requests
    request = rcvPayload['request']
    try:
        if request == 'containers':
            rcvPayload['data'] = dkrDetails('Containers')
            rcvPayload['result'] = 'success'
            return rcvPayload
        if request == 'containerLog':
            rcvPayload['log'] = dkrClient.containers.get(rcvPayload['container']).logs().decode("utf-8").split('\n')
            rcvPayload['result'] = 'success'
            return rcvPayload
        if request == 'containerStop' or request == 'containerStart' or request == 'containerRestart':
            returnData = []
            for container in rcvPayload['containers']:
                try:
                    if request == 'containerStop': dkrClient.containers.get(container).stop()
                    if request == 'containerStart': dkrClient.containers.get(container).start()
                    if request == 'containerRestart': dkrClient.containers.get(container).restart()
                    returnData.append({'result':'success', 'container': container})
                except:
                    returnData.append({'result':'error', 'container': container})
            rcvPayload['data'] = returnData
            return rcvPayload
        if request == 'containerInspect':
            rcvPayload['details'] = dkrClient.containers.get(rcvPayload['container']).attrs
            rcvPayload['result'] = 'success'
            return rcvPayload
    except:
        rcvPayload['result'] = 'error'
        return rcvPayload

def prereqs():
    ''' Check prereqs before starting the agent '''
    ## Create the dkrClient object
    # dkrSock = '/dkrmon/socket/docker.sock'
    dkrSock = '/var/run/docker.sock'
    if os.path.exists(dkrSock):
        global dkrClient
        dkrClient = docker.DockerClient(base_url='unix:/'+dkrSock)
        return True
    else:
        log(('dkrSock does not exist'))
        return False

## Start the agent
startAgent() if prereqs() else sys.exit(1)
