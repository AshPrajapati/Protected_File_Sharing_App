const dotenv = require("dotenv");
const multer = require("multer");
const mongoose = require("mongoose");
const File = require("./models/File");
const express = require("express");
const bcrypt = require("bcrypt");
const app  =express();
app.use(express.urlencoded({ extended: true }))

dotenv.config();

const upload = multer({dest:"uploads"}) //upload the file at destination "uploads"

mongoose.connect(process.env.MONGO_URI)


app.set("view engine","ejs");

app.get("/",(req,res)=>{
    //rendering index view
    res.render("index");
})


//upload.single("file") is middleware i.e. upload the single file whose name field is "file"
app.post("/upload",upload.single("file"),async(req,res)=>{
    const fileData = {
        path: req.file.path,  //multer provides the use of file with req
        originalName: req.file.originalname
    }

    //password is optional
    if(req.body.password!=null && req.body.password!=="")
    {
        fileData.password = await bcrypt.hash(req.body.password,10)
    }

    const file = await File.create(fileData);

    //after get the data from form
    // render the index view at localhost/file/id
    res.render("index",{fileLink:`${req.headers.origin}/file/${file.id}`})
})

app.route("/file/:id").get(handleDownload).post(handleDownload);

//HandleDownload Function
async function handleDownload(req, res) {
  const file = await File.findById(req.params.id)

  //If file has a Password
  if (file.password != null) {
    //file.password shows that whether a file has a password or not
    if (req.body.password == null) {
      //the user wants to access the file has password==NULL and shows the view of password  
      res.render("password")
      return
    }

    if (!(await bcrypt.compare(req.body.password, file.password))) {
        //compare the file password and password entered by the user to access the file
      res.render("password", { error: true })
      return;
    }
  }

  //increase the download count
  file.downloadCount++

  //saving in the database
  await file.save()
  console.log(file.downloadCount)

  //express provides the download function in which we have to pass (path,name of the file)
  res.download(file.path, file.originalName)
}

app.listen(process.env.PORT);