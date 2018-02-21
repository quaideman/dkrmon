## Imports
import socket,json,struct,docker,os,sys,datetime

## Functions
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
    def hostStatCpu():
        try:
            ## Get the load averages
            fileObj = open('/proc/loadavg')
            fileContents = fileObj.read().strip('\n').split()
            fileObj.close()
            avg1 = fileContents[0]
            avg5 = fileContents[1]
            avg15 = fileContents[2]

            ## Work out the percentages
            fileObj = open('/proc/stat')
            fileContents = fileObj.read().split('\n')
            fileObj.close()
            cpuCount = 0
            for line in fileContents:
                if line:
                    key = line.split()[0]
                    value = line.split()[1:]
                    if key.startswith('cpu'):
                        cpuCount += 1
            avg1Pct = (float(avg1) / cpuCount) * 100
            avg5Pct = (float(avg5) / cpuCount) * 100
            # returnData = {'avg1':float(avg1),'avg5':float(avg5),'avg15':float(avg15),'avg1Pct':int(avg1Pct),'avg5Pct':int(avg5Pct)}
            return str(int(avg1Pct))
        except:
            return {'result':'error','message':'Unable to get cpu info'}
    def hostStatRam():
        try:
            fileObj = open('/proc/meminfo')
            fileContents = fileObj.read().split('\n')
            fileObj.close()
            dict = {}
            for line in fileContents:
                if line:
                    key = line.split()[0].strip(':')
                    value = line.split()[1]
                    dict[key] = value
            usage = int(dict['MemTotal']) - int(dict['MemAvailable'])
            usagePct = (usage / int(dict['MemTotal'])) * 100
            returnData = {
                'memTotal':int( int(dict['MemTotal']) / 1024 ),
                'memFree':int( int(dict['MemFree']) / 1024 ),
                'memAvailable':int( int(dict['MemAvailable']) / 1024 ),
                'memUsage':int( int(usage) / 1024 ),
                'memUsagePct':int(usagePct),
            }
            return str(returnData['memUsagePct'])
        except:
            return {'result':'error','message':'Unable to get host memory info'}
    def hostInfoStorage():
        try:
            info = dkrClient.info()
            driver = info['Driver']
            dockerRootDir = info['DockerRootDir']
            statvfs = os.statvfs(dockerRootDir)
            size = statvfs.f_frsize * statvfs.f_blocks # Size of filesystem in bytes
            free = statvfs.f_frsize * statvfs.f_bfree # Actual number of free bytes
            avail = statvfs.f_frsize * statvfs.f_bavail # Number of free bytes that ordinary users are allowed to use (excl. reserved space)
            size = (size / 1024) / 1024 # In MB
            free = (free / 1024) / 1024 # In GB
            avail = (avail / 1024) / 1024 # In MB
            usage = size - avail # Actual usage
            usagePct = (usage / size) * 100 # Usage percentage
            returnData = {'driver':driver,'size':int(size),'free':int(free),'avail':int(avail),'usage':int(usage),'usagePct':int(usagePct)}
            return returnData['usagePct']
        except:
            return {'result':'error','message':"Error in hostInfoStorage"}

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
        if request == 'hostStats':
            rcvPayload['stats'] = {'cpu': hostStatCpu(),'ram':hostStatRam(),'disk':hostInfoStorage()}
            rcvPayload['result'] = 'success'
            return rcvPayload
        if request == 'volumes':
            rcvPayload['volumes'] = dkrDetails('Volumes')
            rcvPayload['result'] = 'success'
            return rcvPayload
        if request == 'images':
            rcvPayload['images'] = dkrDetails('Images')
            rcvPayload['result'] = 'success'
            return rcvPayload
        if request == 'pruneVolumes':
            rcvPayload['resultData'] = dkrClient.volumes.prune()
            rcvPayload['result'] = 'success'
            return rcvPayload
        if request == 'pruneImages':
            rcvPayload['resultData'] = dkrClient.images.prune()
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

## Start
startAgent() if prereqs() else sys.exit(1)
