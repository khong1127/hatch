# Design Changes Since Frontend

While setting up my frontend, a problem I came across was that my images would just show up as boxes with the IDs of the image. For a social media app, this obviously wouldn't do; what I wanted was for the images themselves to render on the screen. Luckily, this [post on Piazza](https://piazza.com/class/melw05erqym3qt/post/154) was very useful in getting this fixed.

Following the steps written by Sinjin, I created a new File concept that would utilize Google Cloud Storage. This way, then images could be retrieved with URLs and get rendered appropriately.

