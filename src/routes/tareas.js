const express = require('express');
const router = express.Router();
const Tareas = require('../model/tarea')
const errorMessage = require('../lib/errorMessageValidation');

router.get('/', (req, res) => {
    res.render('./tareas/tareas');
})

router.get('/todas', async (req, res) => {
    const tareas = await Tareas.find();
    res.json(tareas);
})

router.post('/insertar', async (req, res) => {
    const valores = req.body
    const tarea = new Tareas ({...valores})
    try {
        await tarea.save();
        res.json({message: 'Tarea Ingresada Correctamente', css: 'success', redirect: '/tareas'})
    } catch (error) {
        const mensaje = errorMessage.crearMensaje(error);
        res.json({message: mensaje, redirect: 'error'})
        return;
    }
})

router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    await Tareas.findByIdAndDelete(id);
    res.json({message: 'Tarea eliminada de forma correcta', css: 'success', redirect: 'remove'});
})

router.get('/editar/:id', async (req, res) => {
    const { id } = req.params;
    const tarea = await Tareas.findById(id);
    res.json(tarea);
})

router.post('/editar/:id', async (req, res) => {
    const valores = req.body
    try {
        await Tareas.findByIdAndUpdate({_id: req.params.id}, { ...valores }, { runValidators: true });
        res.json({message: 'Tarea actualizada de forma correcta', css: 'success', redirect: 'remove'});
    } catch (error) {
        const mensaje = errorMessage.crearMensaje(error);
        res.json({message: mensaje, redirect: 'error'})
        return;
    }
})

router.put('/estado/:id', async (req, res) => {
    const { id } = req.params;
    const { state } = req.body;
    await Tareas.findByIdAndUpdate({_id: id}, { estado: state });
    res.json({message: 'Estado modificado', css: 'success', redirect: 'remove'});
})

module.exports = router