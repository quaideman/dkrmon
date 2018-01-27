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
                log(('INFO','Request for',rcvPayload['request']))
                sndPayload = myRequests(rcvPayload['request'])
                sndPayload = json.dumps(sndPayload)
                sndPayload = sndPayload.encode()
                socketSnd(clientsocket, sndPayload)
            except:
                log(('ERR','Agent exited abnormally'))
                sys.exit(1)
            finally:
                clientsocket.close()
    except:
        log(('ERR','Agent failed to start or exited abnormally'))

def myRequests(request):
    ''' Request handlers for requests made against this agent '''
    def status():
        returnData = {'status':'OK'}
        return returnData

    def dkrDetails():
        # dkrClient = docker.DockerClient(base_url='unix://dkrmon/socket/docker.sock')
        # dkrClient = docker.from_env()
        returnData = dkrClient.df()
        return returnData
    ## Switch the requests
    try:
        if request == 'status':
            return status()
        elif request == 'dkrDetails':
            return dkrDetails()
    except:
        if request == 'status':
            return {'request':'status','result':'error','message': 'Failed to get my status'}
        elif request == 'dkrDetails':
            return {'request':'dkrDetails','result':'error','message': 'Unable to communicate with Docker daemon'}
        log(('ERR','myRequests','Something went wrong'))

def prereqs():
    ''' Check prereqs before starting the agent '''
    ## Create the dkrClient object
    dkrSock = '/dkrmon/socket/docker.sock'
    if os.path.exists(dkrSock):
        dkrClient = docker.DockerClient(base_url='unix:/'+dkrSock)
        return True
    else:
        log(('dkrSock does not exist'))
        return False

## Start the agent
startAgent() if prereqs() else sys.exit(1)
