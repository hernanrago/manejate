const express = require('express');
const router = express.Router();
const User = require('../model/user');
const path = require('path');
const fs = require('fs-extra');
const errorMessage = require('../lib/errorMessageValidation');
const mailer = require('../lib/mailer');

router.get('/', (req, res) => {
    res.render('users/users');
});

router.get('/obtener', async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users);
});

router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    const resp = await User.findByIdAndDelete(id);
    if(resp.img != 'avatar.jpg') {
        await fs.unlink(path.resolve('./src/public/img/' + resp.img));
    }
    res.json({message: 'Usuario eliminado de forma correcta', css: 'success', type: true});
});

router.get('/editar/:id', async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    res.json(user);
});

router.post('/editar/:id', async (req, res) => {
    const { nombre, apellido, rol, telefono } = req.body;
    try {
        await User.findByIdAndUpdate({_id: req.params.id}, { nombre, apellido, rol, telefono }, { runValidators: true });
        res.json({message: 'Usuario actualizado de forma correcta', css: 'success', type: true});
    } catch (error) {
        const mensaje = errorMessage.crearMensaje(error);
        res.json({message: mensaje, type: false})
        return;
    }
});

router.put('/estado/:id', async (req, res) => {
    const { id } = req.params;
    const { state } = req.body;
    await User.findByIdAndUpdate({_id: id}, { state });
    res.json({message: 'Estado modificado', css: 'success', type: true});
})

router.get('/newpass', async (req, res) => {
    res.render('users/newpass');
})

router.post('/newpass/:id', async (req, res) => {
    const { id } = req.params;
    const { passwordActual, nuevaPass, repNuevaPass} = req.body;
    if(nuevaPass === repNuevaPass){
        const user = await User.findById(id);
        const pass = await user.comparePassword(passwordActual, user.password)
        if(pass) {
            const password = await user.encryptPassword(nuevaPass);
            await user.updateOne({password: password})
            res.json({message: 'Password cambiada', css: 'success', type: true})
        } else {
            res.json({message: 'La password ingresada no es correcta', css: 'danger', type: true})
        }
    } else{
        res.json({message: 'Las password no coinciden',css: 'danger', type: true})
    }
})

router.post('/avatar/:id', async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id)
    const imagePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const targetPath = path.resolve(`src/public/img/${id}${ext}`);

    if(user.img !== 'avatar.jpg'){
        await fs.unlink(path.resolve('./src/public/img/' + user.img));
    }

    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif') {
        await fs.rename(imagePath, targetPath);
        const nombArch = id + ext;
        await user.updateOne({ img: nombArch });
        res.json({message: 'Imagen ingresada de forma correcta', css: 'success', type: true});
    } else {
        await fs.unlink(imagePath);
        res.json({message: 'Imagen no soportada', css: 'danger', type: true});
    }
})

router.post('/insertar', async (req, res) => {
    const {nombre, apellido, email, rol, telefono} = req.body;
    const user = new User({nombre, apellido, email, rol, telefono})
    user.password = user.genPass()
    // console.log(user.password) 
    user.password = await user.encryptPassword(user.password);
    try {
        await user.save()
        // await mailer.renew(user.email, user.nombre, user.apellido, password)
        res.json({message: 'Usuario ingresado de forma correcta', css: 'success', type: true});
    } catch (error) {
        const mensaje = errorMessage.crearMensaje(error);
        return res.json({message: mensaje, type: false})
    }
})

module.exports = router;