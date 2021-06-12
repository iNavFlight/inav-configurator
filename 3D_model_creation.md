# Creating a 3D model for Configurator
I recently made a couple of 3D models for the setup page of configurator, so thought I'd document the process of getting them in to iNav.
## Pre-requisites
- Your prefered 3D modeling package. You can use anything, so long as you can export to .obj files, or any other format that can be imported in to Blender.
- [Blender 2.79](https://www.blender.org/download/releases/2-79/). This version is needed for the JSON exporter.
- [Three.js version 0.92](https://github.com/mrdoob/three.js/releases/tag/r92). This is the last version with the Blender addon included.
### Installing Three.js
- Install Blender
- Extract the Three.js zip file, and navigate to __/three.js-r92/utils/exporters/blender/addons__
- Copy the __io_three__ folder and navigate to __install_drive://Program Files/Blender Foundation/Blender/2.79/scripts/addons__
- Paste the __io_three__ folder in to the blender __addons__ folder
- Open Blender and from the menu, head to __File__ > __User Preferences...__
- Go to the __Addons__ tab and type Thr in to the search box
- Check the box to enable the Three.js addon, then click the __Save User Settings__ button
## Creating the model
Create the model in your preferred 3D package. I use Fusion 360 and created quite large models. The size doesn't matter, it can be resized in Blender. I simply created the model, combined most parts, and added colour where I wanted it. The annoying thing is that the materials don't copy across in to Blender. But it's easier to get everything set with the package you're comfortable with. I would also highly reccomend naming each object in the model, as it will make things simpler later on. I also name the materials, as I'm sure Blender understands the material names. Once you're happy with the model, export it as an .obj file.
## Basic modification in Blender
Open Blender, and import your .obj. This should be pretty uneventful. 
###Scaling
But if your model is large, you may just see an obstructed camera. If this is the case, switch to a flat on view (Top, Bottom, Left, Right, Front, or Back); which you access from the View menu in the bottom left corner of the screen, next to the 3D cube.
![image](https://user-images.githubusercontent.com/17590174/120713107-6193c480-c4b9-11eb-80f0-9e95cf0cae4b.png)

At that point, you should be able to use the + and - keys on the number pad to zoom in and out. Zoom out until you can see your complete model. Then click the __Scale__ button and move the mouse to resize the model. You want to make it smaller until you can see a grid area underneath it. A good size seems to be around 2.75 empty grid squares around the largest dimensions.
###Rotating
At this point, your model should be the right size. However, it may not be facing the correct way. From the __Top__ view, you should be looking down on the top of your model. However, when using the __Front__ view, I have found that looking at the back of the model is the correct way around for Configurator. To rotate your model, click the __Rotate__ button and move the mouse. If you hold the __shift__ key while moving the mouse, you have finer control.
###Materials
Next up, you will want to replicate the materials that you selected when designing the model. I'm not going to go in to detail, but select the part that you wish to edit from the list in the top right of the screen. Below that is a button menu for what you can modify. Find the 3D sphere and click that. There you will find the materials editor, where you can change colours etc.
![image](https://user-images.githubusercontent.com/17590174/120714284-e59a7c00-c4ba-11eb-83d6-cff07a8fb476.png)

###Joining
The final stage before exporting the model is joining all the individual parts. You can still edit things afterwards. But if you don't do this, you will only export the last selected part. First, select all the parts of the 3D model that you want visible in configurator. Click on the triangle to the left of the object name, in the obkect list in the top right of the screen. Hold the __shift__ key to select multiples. Once they're all selected, hold __Ctrl__ and press __J__. The parts should all now join, and you will see only one object in the list (objects not selected to be joined will of course still be there). If it didn't work, try __Ctrl__ + __J__ again, as sometimes I have had to issue the command twice.
## Exporting the model to JSON
Select you joined object and head to the top menu with __File__ > __Export__ > __Three.js (.json)__. Selecting the export folder and giving it a name should be pretty straight forward. However, you'll be wanting the __Export THREE__ export settings. These have worked fine for me.
![image](https://user-images.githubusercontent.com/17590174/120716222-a28dd800-c4bd-11eb-99c7-a5c5dd9da32d.png)

You can then put the .json model in the Configurator __/resources/models/__ folder, and ammend the code to display the model.
