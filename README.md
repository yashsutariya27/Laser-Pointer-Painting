# Cave Painting
Draw cave paintings on a wall using a laser pointer

## Setup
* Machine running this client
* Projector pointing at wall
* Camera calibrated to match projection surface
* Camera with lowest possible exposure to only show laser pointer spot
* Laser pointers

## Developing client
*  npm run dev will launch with nodemon
*  FE will reload automatically on file save
*  An additional `/debug` route can be opened on a separate device/window, which will stream details of currently registered shapes

## Running client
*  Configure webcam:
    *  Disable aperture priority mode, ensure exposure mode is set to fixed/manual
    *  Reduce exposure until only visible light source is laser pointer on projection wall
*  `npm run start` will launch application on `:3000`
*  Open Chrome and fullscreen page

## Displaying shapes
*  Each time a shape has vanished, it will be sent via socket to the FE server
*  FE server submits details to a Supabase database
*  Shapes can then later be reproduced, either in *realtime* or at a later date in a timeline format
*  An example of how to consume data can be found, here: https://github.com/RandomStudio/random-studio/tree/master/src/components/PartyHeader
