from flask import Flask,jsonify,render_template,request,redirect
from datetime import datetime,timedelta
import docker, time
app = Flask(__name__)

## GLOBAL
client = docker.DockerClient(base_url='unix://dkrmon/socket/docker.sock')

def fileContents(filePath):
    try:
        ## Create a file object
        fileObj = open(filePath)
        ## Store the contents of the file
        returnData = fileObj.read().strip('\n')
        ## Close the object
        fileObj.close()
    except:
        print('### ERR: Unable to get file contents:'+filePath)
    else:
        return returnData

## ROUTES
@app.route('/my/health')
def myHealth():
    return 'OK'

## Host
@app.route('/host/info/details')
def hostInfoDetails():
    try:
        returnData = client.info()
    except:
        return jsonify({'result':'error','message':'Unable to get host info details'})
    else:
        return jsonify({'result':'success','message':'Got host info details','data':returnData})

@app.route('/host/info/cpu')
def hostInfoCpu():
    try:
        ## Get the load averages
        fileObj = open('/proc/loadavg')
        fileContents = fileObj.read().strip('\n').split()
        fileObj.close()
        avg1 = fileContents[0]
        avg5 = fileContents[1]
        avg15 = fileContents[2]

        ## Work out the avg5 percentage
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
        returnData = {'avg1':float(avg1),'avg5':float(avg5),'avg15':float(avg15),'avg1Pct':int(avg1Pct),'avg5Pct':int(avg5Pct)}
    except:
        return jsonify({'result':'error','message':'Unable to get cpu info'})
    else:
        return jsonify({'result':'success','message':'Got cpu info','data':returnData})

@app.route('/host/info/memory')
def hostInfoMemory():
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
    except:
        return jsonify({'result':'error','message':'Unable to get host memory info'})
    else:
        return jsonify({'result':'success','message':'Got host memory info','data':returnData})

@app.route('/host/info/storage')
def hostInfoStorage():
    try:
        import os
        #client = docker.from_env()
        info = client.info()
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
    except:
        return jsonify({'result':'error','message':"Error in hostInfoStorage"})
    else:
        return jsonify({'result':'success','message':'Got host info storage','data':returnData})

## Containers
@app.route('/containers/get')
def containersGet():
    try:
        allContainers = client.containers.list(all)
        systemTime = datetime.now()
        returnData = []
        for container in allContainers:
            item = {}
            item['name'] = container.name
            item['shortId'] = container.short_id
            item['image'] = container.attrs['Config']['Image']
            item['cmd'] = container.attrs['Path']
            item['created'] = (container.attrs['Created']).split('.')[0]
            item['status'] = container.status
            ## Heath status if available
            if 'Health' in container.attrs['State']:
                item['health'] = container.attrs['State']['Health']['Status']
            else:
                item['health'] = "NA"
            ## Ports if available
            ports = container.attrs['NetworkSettings']['Ports']
            resultPorts = ""
            for port in ports:
                if ports[port]:
                    hostPort = ports[port][0]['HostPort']
                    resultPorts += str(hostPort+' > '+port)
                else:
                    resultPorts += str(port)
            item['ports'] = resultPorts

            ## Only if the container is running
            if container.status == 'running':
                startedAt = datetime.strptime((container.attrs['State']['StartedAt']).split('.')[0],"%Y-%m-%dT%H:%M:%S")
                uptime = str(systemTime - startedAt).split('.')[0]
                item['uptime'] = uptime
                item['memoryPct'] = containerStatMemory(container.id)['memoryPct']
            ## Append the container values
            returnData.append(item)
    except:
        return jsonify({'result':'error','message':'Unable to get containers'})
    else:
        return jsonify({'result':'success','message':'Got containers','data':returnData})

@app.route('/container/stop/<container>')
def containerStop(container):
    try:
        client.containers.get(container).stop()
    except:
        return jsonify({'result':'error','message':'Unable to stop container: '+container})
    else:
        return jsonify({'result':'success','message':'Stopped container: '+container})

@app.route('/container/start/<container>')
def containerStart(container):
    try:
        client.containers.get(container).start()
    except:
        return jsonify({'result':'error','message':'Unable to start container: '+container})
    else:
        return jsonify({'result':'success','message':'Started container: '+container})

@app.route('/container/restart/<container>')
def containerRestart(container):
    try:
        client.containers.get(container).restart()
    except:
        return jsonify({'result':'error','message':'Unable to restart container: '+container})
    else:
        return jsonify({'result':'success','message':'Restarted container: '+container})

@app.route('/container/log/<container>')
def containerLog(container):
    try:
        returnData = client.containers.get(container).logs().decode("utf-8").split('\n')
    except:
        return jsonify({'result':'error','message':'Unable to get Log for container: '+container})
    else:
        return jsonify({'result':'success','message':'Got Log for container: '+container,'data':returnData})

@app.route('/container/top/<container>')
def containerTop(container):
    try:
        top = client.containers.get(container).top()
        ## Format the values for tabulator
        returnData = []
        for process in top['Processes']:
            item = {}
            item['uid'] = process[0]
            item['pid'] = process[1]
            item['ppid'] = process[2]
            item['c'] = process[3]
            item['stime'] = process[4]
            item['tty'] = process[5]
            item['time'] = process[6]
            item['cmd'] = process[7]
            returnData.append(item)
    except:
        return jsonify({'result':'error','message':'Unable to get Top for container: '+container})
    else:
        return jsonify({'result':'success','message':'Got Top for container: '+container,'data':returnData})

@app.route('/container/inspect/<container>')
def containerInspect(container):
    try:
        returnData = client.containers.get(container).attrs
    except:
        return jsonify({'result':'error','message':'Unable to inspect container: '+container})
    else:
        return jsonify({'result':'success','message':'Got inspect for: '+container,'data':returnData})

@app.route('/container/remove/<container>')
def containerRemove(container):
    try:
        client.containers.get(container).remove(force=True)
    except:
        return jsonify({'result':'error','message':'Unable to remove container: '+container})
    else:
        return jsonify({'result':'success','message':'Removed container: '+container})

def containerStatMemory(container):
    try:
        memoryUsage = fileContents("/dkrmon/stats/memory/{}/memory.usage_in_bytes".format(container))
        memoryLimit = fileContents("/dkrmon/stats/memory/{}/memory.limit_in_bytes".format(container))
        memoryUsagePct = (int(memoryUsage) / int(memoryLimit)) * 100
        returnData = {'memoryUsage':memoryUsage,'memoryLimit':memoryLimit,'memoryPct':int(memoryUsagePct)}
    except:
        print('### ERR: Unable to get memory stats for container:'+container)
    else:
        return returnData

## Images
@app.route('/images/get')
def imagesGet():
    try:
        images = client.images.list()
        returnData = []
        for image in images:
            item = {}
            item['created'] = image.attrs['Created']
            ## Get the size and convert to MB
            item['size'] = str( int( (int(image.attrs['Size']) / 1024 ) / 1024) )
            imageRepos = image.attrs['RepoTags']
            if imageRepos:
                ## Image repos can have multiple so only take the first one
                item['name'] = imageRepos[0]
                item['repo'] = (imageRepos[0]).split(':')[0]
                item['tag'] = (imageRepos[0]).split(':')[1]
            else:
                item['name'] = "NA"
                item['repo'] = "NA"
                item['tag'] = "NA"
            ## Append the container values
            returnData.append(item)
    except:
        return jsonify({'result':'error','message':'Unable to get images'})
    else:
        return jsonify({'result':'success','message':'Got images','data':returnData})

@app.route('/image/inspect/<image>')
def imageInspect(image):
    try:
        returnData = client.images.get(image).attrs
    except:
        return jsonify({'result':'error','message':'Unable to inspect image: '+image})
    else:
        return jsonify({'result':'success','message':'Got inspect for: '+image,'data':returnData})

@app.route('/images/prune')
def imagePrune():
    try:
        returnData = client.images.prune({'dangling': True})
    except:
        return jsonify({'result':'error','message':'Unable to prune images'})
    else:
        return jsonify({'result':'success','message':'Images pruned','data':returnData})

@app.route('/image/remove/<image>')
def imageRemove(image):
    try:
        client.images.remove(image=str(image))
    except:
        return jsonify({'result':'error','message':'Unable to remove image: '+image})
    else:
        return jsonify({'result':'success','message':'Image removed: '+image})

## Volumes
@app.route('/volumes/get')
def volumesGet():
    try:
        volumes = client.volumes.list()
        returnData = []
        for volume in volumes:
            item = {}
            item['name'] = volume.attrs['Name']
            item['created'] = volume.attrs['CreatedAt']
            item['driver'] = volume.attrs['Driver']
            item['mount'] = volume.attrs['Mountpoint']
            ## Append the container values
            returnData.append(item)
    except:
        return jsonify({'result':'error','message':'Unable to get volumes'})
    else:
        return jsonify({'result':'success','message':'Got volumes','data':returnData})

@app.route('/volumes/prune')
def volumesPrune():
    try:
        returnData = client.volumes.prune()
    except:
        return jsonify({'result':'error','message':'Unable to prune volumes'})
    else:
        return jsonify({'result':'success','message':'Volumes pruned','data':returnData})

@app.route('/volume/inspect/<volume>')
def volumeInspect(volume):
    try:
        returnData = client.volumes.get(volume).attrs
    except:
        return jsonify({'result':'error','message':'Unable to inspect image: '+volume})
    else:
        return jsonify({'result':'success','message':'Got inspect for: '+volume,'data':returnData})

@app.route('/volume/remove/<volume>')
def volumeRemove(volume):
    try:
        result = client.volumes.get(volume).remove()
    except:
        return jsonify({'result':'error','message':'Unable to remove volume'})
    else:
        return jsonify({'result':'success','message':'Volume removed: '+volume})


## If root is hit, assume containers
@app.route('/')
def loadMain():
    #return render_template('containers.html')
    #return redirect("/containers", code=302)
    return render_template('main.html')
