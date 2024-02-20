# INAV Configurator MapProxy setup

There are several different approaches to setting up MapProxy service. All that iNav needs is a 
working MapProxy WMS URL and the name of the layer that you want to use for caching

## Generic MapProxy Installation Guides
https://mapproxy.org/docs/latest/install.html Unix Install Guide

https://mapproxy.org/docs/latest/install_windows.html Windows Install Guide

https://hub.docker.com/r/yagajs/mapproxy/ Docker image (untested)

## Linux MapProxy virtual machine setup instructions
1. Using virtualization platform of your choice, install a base 14.04 LTS Ubuntu server
    http://releases.ubuntu.com/14.04/ubuntu-14.04.5-server-i386.iso
1. Use NAT networking so that the virtual machine can download maps while online
1. Create a mapproxy user (this can be done during installation)
1. All commands executed as mapproxy user from mapproxy user home directory
1. Choose defaults for everything else unless you want to change anything
1. After installation, update all packages and reboot
    ```console
    sudo apt-get update && sudo apt-get upgrade && sudo reboot
    ```
1. Set a static IP so that your iNav proxy URL does not need to be updated
    ```console
    # get dhcp ip address and host gateway
    mapproxy@MapProxy:~$ ip route get 8.8.8.8 | awk '{print $NF; exit}'
    192.168.145.133
    mapproxy@MapProxy:~$ cat /etc/resolv.conf | tail -n 1
    nameserver 192.168.145.2
    mapproxy@MapProxy:~$ route
    Kernel IP routing table
    Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
    default         192.168.145.2   0.0.0.0         UG    0      0        0 eth0
    192.168.145.0   *               255.255.255.0   U     0      0        0 eth0
    mapproxy@MapProxy:~$ sudo vi /etc/network/interfaces
    # replace existing eth0 section with this:
    auto eth0
    iface eth0 inet static
        address 192.168.145.20
        netmask 255.255.255.0
        network 192.168.145.0
        broadcast 192.168.145.255
        gateway 192.168.145.2
        dns-nameservers 192.168.145.2
    # reboot to apply changes
    mapproxy@MapProxy:~$ sudo reboot
    ```
1. Install ssh server so you can connect from host
    ```console
    sudo apt-get -y install openssh-server
    ```
1. Connect to virtual machine ssh using mapproxy@192.168.145.20
1. Install python-virtualenv and dependencies
    ```console
    sudo apt install python-virtualenv python-imaging python-yaml libproj0 \
       build-essential python-dev libjpeg-dev \
       zlib1g-dev libfreetype6-dev libapache2-mod-wsgi apache2
    ```
1. Update pillow and install mapproxy
    ```console
    sudo pip install pillow 
    sudo pip install MapProxy
    ```
1. Initialize MapProxy server
    ```console
    # check that mapproxy is installed
    mapproxy-util --version
    # create inav config
    mapproxy-util create -t base-config inavmapproxy
    virtualenv --system-site-packages mapproxy
    source mapproxy/bin/activate
    ```
1. Update apache wsgi.conf
    ```console
    sudo vi /etc/apache2/mods-available/wsgi.conf
    ```
    so it looks like this:
    ```apache
    WSGIScriptAlias /inavmapproxy /home/mapproxy/inavmapproxy/config.py
    WSGIDaemonProcess mapproxy user=mapproxy group=mapproxy processes=8 threads=25
    WSGIProcessGroup mapproxy
    # WSGIPythonHome should contain the bin and lib dir of your virtualenv
    WSGIPythonHome /home/mapproxy/mapproxy
    WSGIApplicationGroup %{GLOBAL}

    <Directory /home/mapproxy/inavmapproxy/>
      Order deny,allow
      Require all granted
    </Directory>
    ```
1. Create wsgi config file
    ```console
    vi inavmapproxy/config.py
    ```
    with the following content:
    ```python
    from mapproxy.wsgiapp import make_wsgi_app
    application = make_wsgi_app(r'/home/mapproxy/inavmapproxy/mapproxy.yaml')
    ```
1. Enable wsgi and restart apache
    ```console
    sudo a2enmod wsgi
    sudo service apache2 restart
    ```
1. Test your MapProxy instance using web browser on host, you should see a demo link
    http://192.168.145.20/inavmapproxy/
1. Open iNav Configurator, connect to your flight controller
1. In upper right corner click on Application Options (gears icon)
1. For MapProxy URL use:
    http://192.168.145.20/inavmapproxy/service?
1. For MapProxy layer use:
    osm
1. If everything is working you should see a map in the GPS and Mission Planner tabs
1. You can change your server configuration by editing
    ```console
    mapproxy@MapProxy:~$ vi ~/inavmapproxy/mapproxy.yaml
    ```
    After editing configuration, restart apache
    ```console
    mapproxy@MapProxy:~$ sudo /etc/init.d/apache2 restart
    ```
1. Some additional sample configurations, use at your own discretion (change layer in inav to layer from configuration)
    ```yaml
    # mundialis openstreetmap wms example
    services:
      demo:
      wms:
        md:
          title: MapProxy WMS Proxy
    layers:
      - name: osm
        title: mundialis
        sources: [osm_cache]
    caches:
      osm_cache:
        grids: [webmercator]
        sources: [osm_wms]
    sources:
      osm_wms:
        type: wms
        req:
          url: http://ows.mundialis.de/services/service?
          layers: osm
    grids:
        webmercator:
            base: GLOBAL_WEBMERCATOR
    ```
    
    ```yaml
    # google maps hybrid example, use inav_layer in configurator as layer name
    services:
      demo:
      wms:
        md:
          title: MapProxy WMS Proxy
    layers:
      - name: inav_layer
        title: Google Maps Hybrid
        sources: [inav_cache]
    caches:
      inav_cache:
        grids: [inav_grid]
        sources: [inav]
        cache:
          type: file
          directory_layout: tms
    sources:
      inav:
        type: tile
        url: http://mt0.google.com/vt/lyrs=y&hl=en&x=%(x)s&y=%(y)s&z=%(z)s
        grid: inav_grid
    grids:
      inav_grid:
        base: GLOBAL_MERCATOR
        origin: ul
    ```
1. You can use any map provider that is compatible with MapProxy, and once you zoom in on the region you will be flying in, the map tiles will be cached for offline use. You can test this by disabling your internet connection and browsing the demo URL in a browser
	  
    https://wiki.openstreetmap.org/wiki/WMS#OSM_WMS_Servers OpenStreetMap WSM servers 
	  
    https://lpdaac.usgs.gov/data_access/web_map_services_wms # USGS currently has 400+ WMS layers
    
    * You can use QGIS to browse different providers and pick the maps you like for your iNav layers
	  https://qgis.org/en/site/
    
    * There are many government and public WMS providers available in different regions worldwide
