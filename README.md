# thing-it-device-bacnet

[![NPM](https://nodei.co/npm/thing-it-device-bacnet.png)](https://nodei.co/npm/thing-it-device-bacnet/)
[![NPM](https://nodei.co/npm-dl/thing-it-device-bacnet.png)](https://nodei.co/npm/thing-it-device-bacnet/)

[thing-it-node] Device Plugin for BACnet networks to control BACnet devices.

The BACnet Device Plugin is operational for the scope described here which represents a subset of the full
BACnet protocol plus [thing-it] specific usages, such as higher level compelx devices. Contact us
if you're interested in connecting [thing-it] to your BACnet environment and / or supporting additional
BACnet features, devices, or objects.

## Description

This Device Plugin allows you to

* show and modify values of any BACnet object of a BACnet device via the [thing-it] Mobile App and
the [thing-it] portal at [www.thing-it.com](http://www.thing-it.com),
* visualize historic data of any connected BACnet object,
* combine data and controls from any other [thing-it] plugin, and
* define complex scenes, storyboards and timer controlled execution

by connecting an arbitrary number of BACnet devices to a [thing-it-node](https://github.com/marcgille/thing-it-node)
 on the same network. [thing-it-node](https://github.com/marcgille/thing-it-node) can be run
 on a variety of computers incuding Raspberry Pis and Linux server.

Hereby, this plugin represents basic BACnet Objects such as

* **Analog Input**
* **Analog Value**
* **Binary Input**
* **Binary Value**
* **Multi State Input**
* **Multi State Value**

connected to a generic **BACnet Device** and communication to those via UDP/IP.

The plugin also supports specific higher level devices, such as

* **Thermostat**
* **Light**
* **Jalousie**

by bundling a series of individual BACnet objects into a logical context.

## User Interface Examples

## Mobile UI

<p align="center"><a href="https://raw.githubusercontent.com/thing-it/thing-it-device-bacnet/master/documentation/images/mobile-ui.png"><img src="https://raw.githubusercontent.com/thing-it/thing-it-device-bacnet/master/documentation/images/mobile-ui.png" width="70%" height="70%"></a></p>

### BACnet Object Configuration

<p align="center"><a href="https://raw.githubusercontent.com/thing-it/thing-it-device-bacnet/master/documentation/images/bacnet-object-configuration.png"><img src="https://raw.githubusercontent.com/thing-it/thing-it-device-bacnet/master/documentation/images/bacnet-object-configuration.png" width="75%" height="75%"></a></p>

### Higher Level BACnet Device Configuration

<p align="center"><a href="https://raw.githubusercontent.com/thing-it/thing-it-device-bacnet/master/documentation/images/bacnet-complex-device-configuration.png"><img src="https://raw.githubusercontent.com/thing-it/thing-it-device-bacnet/master/documentation/images/bacnet-complex-device-configuration.png" width="75%" height="75%"></a></p>

### Dashboard

In a dashboard data from a BACnet device, such as
* a room's temperature setpoing history
* the BACnet device's CPU load history and current value
* the BACnet device's internal temperature history and current value

can be combined with [thing-it-device-weather](https://github.com/klausberberich/thing-it-device-weather) data, such as
* historic outside temperature
* historic outside humidity

<p align="center"><a href="https://raw.githubusercontent.com/thing-it/thing-it-device-bacnet/master/documentation/images/bacnet-data-visualization.png"><img src="https://raw.githubusercontent.com/thing-it/thing-it-device-bacnet/master/documentation/images/bacnet-data-visualization.png" width="100%" height="100%"></a></p>

### Non-Developers

Contact us if you're interested in connecting to your BACnet environment via mobile or web.

### Developers

Those who are interested in implementing their own specific higher level BACnet Device e.g. a thermostat with specific
state, services and UI from a [thing-it-node] perspective can still use the **BacNetAdapter** class under **lib** in this
package to easily implement communication with the BACnet network via IP/UDP.

Contact us if you're interested in helping us support additional BACnet features, devices, or objects.

## Installation

### Installation [thing-it-node]

Follow the installation steps at [thing-it-node](https://github.com/marcgille/thing-it-node) to turn your computer
(e.g. your PC, your Raspberry Pi, or a Linux server) into a [thing-it] Gateway. Installing [thing-it-node](https://github.com/marcgille/thing-it-node)
automatically also installs the BACnet plugin.

After installation follow the instructions to pair your [thing-it] Gateway with
[www.thing-it.com](http://www.thing-it.com) and to start the **[thing-it-node]**. Use the configuration portal at
[www.thing-it.com](http://www.thing-it.com) to confirm your [thing-it] Gateway is properly connected.

### Connectivity to BACnet

Make sure that the computer running **[thing-it-node]** (your [thing-it] Gateway) can connect your
BACnet devices via an IP connection. As the BACnet protocol uses UPD broadcasts for an initial WhoIs / IAm handshake
your BACnet devices and your [thing-it] Gateway should be on the same network to simplify the setup.

If your BACnet devices and your [thing-it] Gateway are not in the same network, additional network configuration
and/or hardware may be required to ensure broadcasts from the BACnet devices can be seen by the [thing-it] Gateway and
vice versa.

### Configuring Devices and Actors

Use the configuration portal at [www.thing-it.com](http://www.thing-it.com) to create a BACnet device. You need to know
 either

* the IP address or
* the BACnet device id

of the device to connect with it. Once your device is connected, you can add actors for BACnet objects or
 complex higher level objects in the configuration as shown in the UI examples above.


## Where to go from here ...

After completing the above, you may be interested in

* Configuring additional [Devices](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/deviceConfiguration),
[Groups](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/groupConfiguration),
[Services](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/serviceConfiguration),
[Event Processing](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/eventConfiguration),
[Storyboards](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/storyboardConfiguration) and
[Jobs](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/jobConfiguration) via your **[thing-it] Mobile App**.
* Use [thing-it.com](https://www.thing-it.com) to safely connect your Node Box from everywhere, manage complex configurations, store and analyze historical data
and offer your configurations to others on the **[thing-it] Mesh Market**.
* Explore other Device Plugins like [Texas Instruments Sensor Tag](https://www.npmjs.com/package/thing-it-device-ti-sensortag), [Plugwise Smart Switches](https://www.npmjs.com/package/thing-it-device-plugwise) and many more. For a full set of
Device Plugins search for **thing-it-device** on [npm](https://www.npmjs.com/). Or [write your own Plugins](https://raw.githubusercontent.com/marcgille/thing-it-node/wiki/Plugin-Development-Concepts).