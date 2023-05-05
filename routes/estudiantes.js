const express = require('express');     //Importamos express
const joi = require('joi');             //Importamos Joi para validar los datos ingresados por el usuario
const ruta = express.Router();          //Creamos un objeto Router de Express para manejar las rutas

const oEventos = require('./eventos');
const {eventos} = oEventos;

const estudiantes = [];                 

function existeEstudiante(id) {         
    return (estudiantes.find( estudiante => estudiante.id === parseInt(id)));
};

function validarEmail(estudiante, post) {
    if(post)
        return !(estudiantes.find( est => est.email === estudiante.email));
    else
        return !(estudiantes.find( est => est.email === estudiante.email && est.id === estudiante.id)) 
}

function validarEstudiante(est) {   
    const schema = joi.object({
        nombre:  joi.string()
                    .min(3)
                    .required(),
        email:   joi.string()
                    .email()
                    .required(),
        carrera: joi.string()
                    .min(3)
                    .required(),

    });
    return schema.validate(est);
}

ruta.get('/', (req, res) => {
    if (estudiantes.length == 0)
        return res.status(404).send('No hay alumnos creados')
    res.send(estudiantes);
});

ruta.get('/:id', (req, res) => {
    const id = req.params.id;
    let estudiante = existeEstudiante(id);
    if (!estudiante)
        res.status(404).send(`El estudiante ${id} no se encuentra`);
    res.send(estudiante);
});

ruta.post('/', (req, res) => {
    const {error} = validarEstudiante(req.body);  

    let ultimoEstudianteId = 1;
    if(estudiantes.length != 0)
        ultimoEstudianteId = estudiantes[estudiantes.length - 1].id + 1;

    if (!error) {
        const estudiante = {
            id: ultimoEstudianteId,
            nombre: req.body.nombre,
            email: req.body.email,
            carrera: req.body.carrera,
        };
        if (validarEmail(estudiante, true)) {
            estudiantes.push(estudiante);
            return res.send(estudiante);
        }
        return res.status(400).send('El correo ingresado ya está en uso.');      
    }
    return res.status(404).send(error);
});

ruta.put('/:id', (req, res) => {
    let estudiante = existeEstudiante(req.params.id);
    if (!estudiante)
        return res.status(404).send('El estudiante no se encuentra'); 
    const {error, value} = validarEstudiante(req.body);
    if (!error) { 
        if (req.body.email && validarEmail(value, false)){ 
            estudiante.nombre = req.body.nombre;
            estudiante.email = req.body.email;
            estudiante.carrera = req.body.carrera;
            res.send(estudiante);
        }
        return res.status(400).send('El correo ingresado ya está en uso.'); 
    }
    res.status(400).send(error);
});

ruta.delete('/:id', (req, res) => {
    const estudiante = existeEstudiante(req.params.id);
    if (!estudiante) {
        return res.status(404).send('El estudiante no se encuentra');
    }
    eventos.forEach(evento => {
        const index = evento.alumnosInscritos.indexOf(estudiante.id);
        if (index !== -1) {
            evento.alumnosInscritos.splice(index, 1);
        }
    });
    const index = estudiantes.indexOf(estudiante);
    estudiantes.splice(index, 1);      
    res.send(estudiante);
});

const objetoAlumnos = {
    ruta,
    estudiantes,
    existeEstudiante
};

module.exports = objetoAlumnos;