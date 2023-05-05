const express = require('express');     //Importamos express
const joi = require('joi');             //Importamos Joi para validar los datos ingresados por el usuario
const ruta = express.Router();          //Creamos un objeto Router de Express para manejar las rutas

// importamos el objeto importando en eventos.js
const oEventos = require('./eventos');
// en este caso sólo necesitamos el array que contiene a los eventos, por lo cual deconstruimos la respuesta y lo asignamos a eventos
const {eventos} = oEventos;

// array que contendrá a los alumnos creados
const estudiantes = [];                 

// función para verificar que el estudiante existe dentro del array dado el id
function existeEstudiante(id) {         
    return (estudiantes.find( estudiante => estudiante.id === parseInt(id)));
};

// función para validar el email del estudiante que se pretende crear/modificar
// el parametro post es un valor bool que es true cuando se manda llamar en post y false cuando se manda llamar en put
function validarEmail(estudiante, post) {
    if(post)
        return !(estudiantes.find( est => est.email === estudiante.email));
    else
        return !(estudiantes.find( est => est.email === estudiante.email && est.id === estudiante.id)) 
}

// función para validar qu elos datos dados por el usuario están correctos
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

// función para obtener todos los estudiantes creados
ruta.get('/', (req, res) => {
    if (estudiantes.length == 0)
        return res.status(404).send('No hay alumnos creados')
    res.send(estudiantes);
});

// función para obtener un estudiante en especifico dado el ID de este
ruta.get('/:id', (req, res) => {
    const id = req.params.id;
    let estudiante = existeEstudiante(id);
    if (!estudiante)
        res.status(404).send(`El estudiante ${id} no se encuentra`);
    res.send(estudiante);
});

// función para la creación de un estudiante
ruta.post('/', (req, res) => {
    const {error} = validarEstudiante(req.body);  

    // con esto validamos que el id asignado al nuevo estudiante sea el siguiente al ultimo creado
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
        // mandamos llamar la función validar email con parametro post = true
        if (validarEmail(estudiante, true)) {
            estudiantes.push(estudiante);
            return res.send(estudiante);
        }
        return res.status(400).send('El correo ingresado ya está en uso.');      
    }
    return res.status(404).send(error);
});

// función para modificar un alumno dado el id de este
ruta.put('/:id', (req, res) => {
    let estudiante = existeEstudiante(req.params.id);
    if (!estudiante)
        return res.status(404).send('El estudiante no se encuentra'); 
    // deconstruimos la respuesta para utilizarlos en diferentes casos
    const {error, value} = validarEstudiante(req.body);
    if (!error) { 
        // con este bloque validamos que el email que se pretende ingresar existe y que este pertene al
        // mismo id del estudiante que se pretende modificar, con el parametro post de la función validarEmail
        // en false
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

// eliminamos un estudiante en especifico dado el id
ruta.delete('/:id', (req, res) => {
    const estudiante = existeEstudiante(req.params.id);
    if (!estudiante) {
        return res.status(404).send('El estudiante no se encuentra');
    }
    // con la siguiente instrucción eliminamos al estudiante de cualquier evento al que esté inscrito
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

// creamos el objeto alumnos
const objetoAlumnos = {
    ruta,
    estudiantes,
    existeEstudiante
};

module.exports = objetoAlumnos;