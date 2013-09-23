Gsoc-Liquid-Galaxy-Hangouts
Gsoc Liquid Galaxy Video Chat Application Guide



About Liquid Galaxy

Developed by volunteer engineers on their 20% time, Liquid Galaxy provides an immersive Google Earth experience like never before. Step inside a chamber of monitors arranged in a circle around you, and fly anywhere in the world in seconds.
The video-chat application was started as a GSOC project and allows users to meet with their friends online. The application allows multi-screen devices to display a single user on each screen and act like a regular computer.

Find more info at : http://www.google.com/earth/explore/showcase/liquidgalaxy.html
                    http://liquidgalaxy.endpoint.com/

User Guide
This document is a step-by-step guide for LG conference application users.

Regular User
- no LG required, just use a PC and an updated Chrome browser
- go to https://webrtc.liquidgalaxy.org:3004
- type in your name and room and click ‘Go’
- then press ‘Join’
- it takes some time for the remote streams to become visible

Liquid Galaxy User
- the displays of the LG can be either in landscape mode or in portrait mode

-master
- example of url for master:
https://webrtc.liquidgalaxy.org:3004/?type=master&id=liquidgalaxy&room=liquid
- the master displays only one remote stream as a slave does

-slave
- enable screen capture in Chrome (it is behind a flag in chrome://flags)
- go fullscreen
- type in browser the URL with the explained parameters (below is an example - the order of parameters is not important):
https://webrtc.liquidgalaxy.org:3004/?type=slave&id=slave&masterId=masteri&side=left&pos=1&room=liquid
- type is ‘slave’ (other is regular)
- id - the slave id (or name) of the current slave node
- masterId - the id (or name) of the master node
- room - name of the room you want to join
- side - can be left or right
- pos stands for the position of the slave node (starts from 1) in the configuration as in:
3 2 1 0 1 2 3 (0 is the master and the others are the slaves)
- if you have 2 slaves it could be 1 0 1 (one slave on each side)

-example of a 2 slave LG:
-master: https://webrtc.liquidgalaxy.org:3004/?type=master&id=liquidgalaxy&room=liquid
-left slave : 
https://webrtc.liquidgalaxy.org:3004/?type=slave&id=left_slave&masterId=liquidgalaxy&side=left&pos=1&room=liquid&size=3&leftsize=1
-right slave:
https://webrtc.liquidgalaxy.org:3004/?type=slave&id=right_slave&masterId=liquidgalaxy&side=right&pos=1&room=liquid&size=3&leftsize=1

Functionalities of a remote video
- functionalities are visible when the user hovers the remote videos
- the ‘R’ button is the rotation button (rotates the video with 90 deg in case the camera is rotated)
useful to properly display a user on portrait screen with a rotated camera
- the ‘D’ button allows a video stream to be displayed on multiple screens (on a Liquid Galaxy) - (currently works only for the stream that a master displays)
