const Lesson   = require('../models/Lesson.js');
const sharp = require('sharp');


const lessonCtrl = {};

// @desc  Add/Adding a lesson page
// @ met/route POST /
lessonCtrl.addPOST = async (req,res) => {
  try {
    req.body.files  = req.files;
    for(i = 0;i < req.files.length;i++) {
      req.body.files.buffer = await sharp(req.body.files[i].buffer).resize({width : 200, height : 200})
                              .png().toBuffer();
    }
    req.body.user = req.user.id;
    await Lesson.create(req.body);
    res.redirect('/dashboard');
  }catch(e) {
    console.log(e);
    res.render('error/500');
  }
};

// @desc  Show/public lessons page
// @ met/route GET /
lessonCtrl.pLessons = async (req,res) => {
  try {
    const lessons = await Lesson.find({status : 'public'}).populate('user').lean();

    lessons.forEach(lesson => {
      let imge = "";
      if(lesson.user.avatar.link) {
        imge = lesson.user.avatar.link;
      }else {
        imge = "data:image/png;base64,"+lesson.user.avatar.buffer.toString('base64');
      }
      lesson.imge  = imge;
    });
    res.render('lessons/index',{
      lessons,
      allowAdd : true,
      user : req.user.toObject()
    })
  }catch(e){
    console.log(e);
    res.render('error/500');
  }
};


// @desc  Show/Adding a lesson page
// @ met/route GET /
lessonCtrl.add = (req,res) => {
  res.render('lessons/add');
};


// @desc  Show/ edit a lesson page
// @ met/route GET /edit/:id
lessonCtrl.editL = async (req,res) => {
  try {
    const lesson = await Lesson.findOne({
      _id : req.params.id
    }).lean();
    if(!lesson){
      res.render('error/404');
    }
    if(lesson.user != req.user.id){
      return res.redirect('/lessons',{allowAdd : true});
    }else{
      console.log(lesson);
      res.render('lessons/edit', {
        lesson
      });
    }
  }catch(e) {
    console.log(e);
    res.render('error/500');
  }
};

// @desc  Update/Update a lesson
// @ met/route PUT lessons/:id
lessonCtrl.Lupdate = async (req,res) => {
  // console.log(req.body.delfiles);
  try{
    let lesson = await Lesson.findById(req.params.id).lean();
    if(!lesson) {
        return res.render('error/404');
    }
    if(lesson.user != req.user.id) {
      return res.redirect('/lessons');
    }else{
      req.body.files = req.files;
      req.body.user = req.user.id;
      const Oldfiles = lesson.files;
      let allFiles = Oldfiles.concat(req.body.files);
      if(req.body.delfiles) {
        allFiles = allFiles.filter(function(e) {
          return !req.body.delfiles.includes(e.originalname);
        });
      }
      req.body.files = allFiles;
      lesson = await Lesson.findOneAndUpdate(
        { _id : req.params.id },
        req.body,
        {
          new : true,
          runValidators : true,
        });
      res.redirect('/dashboard');
    }
  }catch(e){
    console.log(e);
    res.render('error/500');
  }
};

// @desc    Show single lesson
// @route   GET lessons/:id
lessonCtrl.showSingle = async (req,res) => {
  try{
    let lesson = await Lesson.findById(req.params.id).populate('user').lean();
    let _id = lesson.user._id;
    console.log(req.user);
    if(!lesson) return res.render('error/404');
    if (_id != req.user.id && lesson.status == 'private') {
      res.render('error/404');
    } else {
      res.render('lessons/show', {
        lesson,
        id : lesson._id,
        user : req.user.toObject()
      })
    }
  }catch(e) {
    console.error(err);
    res.render('error/404');
  }
};



// @desc  DELETE/DELETE a lesson page
// @ met/route DELETE lessons/:id
lessonCtrl.Ldelete = async (req,res) => {
  try{
    await Lesson.deleteOne({_id : req.params.id});
    res.redirect('/dashboard');
  }catch(e){
    res.render('error/500');
  }
};

lessonCtrl.showUserLessons = async (req,res) => {
  try {
    console.log(req.params,req.params.userId);
    const lessons = await Lesson.find({
      user: req.params.id,
      status: 'public',
    })
      .populate('user')
      .lean()

    lessons.forEach(lesson => {
      let imge = "";
      if(lesson.user.avatar.link) {
        imge = lesson.user.avatar.link;
      }else {
        imge = "data:image/png;base64,"+lesson.user.avatar.buffer.toString('base64');
      }
      lesson.imge  = imge;
    });

    res.render('lessons/index', {
      lessons,
      allowAdd : true,
      user : req.user.toObject()
    })
  } catch (err) {
    console.error(err);
    res.render('error/500');
  };
};


// @desc  Debug
// @ met/route DELETE lessons/DEBUG/:id
lessonCtrl.DEBUG = async (req,res) => {
  try{
    let lesson = await Lesson.findById(req.params.id).populate('user').lean();
    let file = lesson.files[0];
    res.set({
      'Cache-control': 'no-cache',
      'Content-type': 'image/png',
      'Content-disposition': 'attachment; filename=' + file.originalname
    });
    res.status(200).send(file.buffer);
  }catch(e){
    console.log(e);
    res.render('error/500');
  }
};

lessonCtrl.download = async (req,res) => {
  try{
    let lesson = await Lesson.findById(req.params.id).populate('user').lean();
    let file = lesson.files[0];
    for(i = 0;i < lesson.files.length;i++) {
      if(req.params.filename == lesson.files[i].originalname) {
        res.set({
          'Cache-control': 'no-cache',
          'Content-type': 'image/png',
          'Content-disposition': 'attachment; filename=' + lesson.files[i].originalname
        });
        res.status(200).send(file.buffer);
      }
    }
  }catch(e){
    console.log(e);
    res.render('error/500');
  }
};
module.exports = lessonCtrl;
