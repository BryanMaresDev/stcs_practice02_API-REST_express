const express = require('express'); //Importamos express
const joi = require('joi');         //Importamos Joi para validar los datos ingresados por el usuario
const ruta = express.Router();      //Creamos un objeto Router de Express para manejar las rutas

// Importamos el objeto exportando en estudiantes, para posteriormente utilizarlo
const alumnos = require('./estudiantes');

// Array que contendrá los evento s creados
const eventos = [];    

// Función para verificar la existencia de un evento en base al ID
function existeEvento(id) {                                 
    return (eventos.find( evento => evento.id === parseInt(id)));
}

// verificamos si exisdte un evento que contenga la misma fecha, hora y lugar del evento que se 
// desee modificar/crear
function validarFecha(evento) {    
    const eventoMismaFecha = eventos.find((event) => {
        return event.fecha === evento.fecha && 
               event.hora === evento.hora && 
               event.lugar === evento.lugar
    });

    return !eventoMismaFecha;
}

// validamos que los datos otorgados por el usuario cumplan con los requerimientos definidos
// en el schema
function validarEvento(evento) {    
    const schema = joi.object({
        titulo: joi.string()
                   .min(7)
                   .required(),
        fecha:  joi.string()
                   .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/) // sentencia regex que valida el valor para la fecha con formato yyyy-mm-dd
                   .required(),
        hora:   joi.string()
                   .regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/)                    // sentencia regex para validar formato de fecha en hh:mm
                   .required(),
        lugar:  joi.string()
                   .min(5)
                   .max(60)
                   .required(),
        ponente:joi.string()
                   .min(8)
                   .max(60)
                   .required()
    });
    return schema.validate(evento);
}

// función para obtener todos los eventos existentes
ruta.get('/', (req, res) => {
    if (eventos.length == 0)
        return res.status(404).send('No hay eventos creados');
    res.send(eventos);
});

// función para obtener un evento en especifico
ruta.get('/:id', (req, res) => {                   
    const id = req.params.id;                      
    let evento = existeEvento(id);                 
    if (!evento)                               
        res.status(404).send(`El evento ${id} no se encuentra`);
    res.send(evento);                              
});  

//función para la creación de un evento
ruta.post('/', (req, res) => {                      
    const {error} = validarEvento(req.body);  

    // con esto validamos que el id asignado al nuevo evento sea el siguiente al ultimo creado
    let ultimoEventoId = 1;                        
    if(eventos.length != 0)                    
        ultimoEventoId = eventos[eventos.length - 1].id + 1;   

    if (!error) {                                  
        const evento = {                           
            id: ultimoEventoId,                    
            titulo: req.body.titulo,
            fecha: req.body.fecha,
            hora: req.body.hora,
            lugar: req.body.lugar,
            ponente: req.body.ponente,
            alumnosInscritos: []
        };
        // validamos que no exista otro evento con los mismo valores para fecha, lugar y hora
        if (validarFecha(evento)){                              
            eventos.push(evento);
            res.send(evento);
        }                                            
        return res.status(400).send('Ya existe un evento con la misma fecha, hora y lugar');
    }                                     
    return res.status(400).send(error);
});

// función para la edición de un evento dado su ID
ruta.put('/:id', (req, res) => {
    let evento = existeEvento(req.params.id);
    if (!evento){
        return res.status(404).send('El evento no se encuentra'); 
    }
    const {error} = validarEvento(req.body);
    if (!error) {
        // con la siguiente instrucción verificamos si los camos ingresados son los mismos, dando a entender que sólo se modifó 
        // el título o el ponente, con lo cual, permitimos que se pueda modificar el evento aún teniendo una fecha ya existente
        const fechaMisma = (evento.fecha === req.body.fecha && evento.hora === req.body.hora && evento.lugar === req.body.lugar);
        if(fechaMisma || validarFecha(req.body)){
            evento.titulo = req.body.titulo,
            evento.fecha = req.body.fecha,
            evento.hora = req.body.hora,
            evento.lugar = req.body.lugar,
            evento.ponente = req.body.ponente,        
            res.send(evento);
        } else {
            return res.status(400).send('Ya existe un evento con la misma fecha, hora y lugar');
        }
    } else{
        res.status(400).send(error);
    }
});

// función para eliminar un evento en especifico dado el ID
ruta.delete('/:id', (req, res) => {
    const evento = existeEvento(req.params.id);
    if (!evento) 
        return res.status(404).send('El evento no se encuentra');
    const index = eventos.indexOf(evento);
    eventos.splice(index, 1);      
    res.send(evento);
});

/* FUNCIONES PARA LA MANIPULACIÓN DE LOS ESTUDIANTES INSCRITOS EN EVENTOSS */

// función para obtener los estudiantes inscritos a un evento dado el ID del evento
ruta.get('/estudiantesInscritos/:idEvento', (req, res) => {
    if (eventos.length == 0)
        return res.status(404).send('No hay eventos creados aún.');
    const evento = existeEvento(req.params.idEvento);
    if(evento === undefined)
        return res.status(404).send('Este evento no existe.');
    // obtenemos el array que contiene los ID's de los alumnos inscritos al evento seleccionado
    const alumnosInscritos = eventos[evento.id - 1].alumnosInscritos;
    // sentencia para verificar si existen alumnos inscritos a este evento
    if (alumnosInscritos.length == 0) {
        return res.status(404).send('No hay alumnos inscritos al evento.');
    }
    res.status(200).send(`ID Evento: ${evento.id} \nID alumnos inscritos:\n ${alumnosInscritos}`);
});

// función para inscribir estudiantes a eventos dado el id del alumno y del evento
ruta.post('/estudiantesInscritos/:idEvento/:idEstudiante', (req, res) => {
    const evento = existeEvento(req.params.idEvento);
    const estudiante = alumnos.existeEstudiante(req.params.idEstudiante);
    if(!(evento && estudiante))
        return res.status(404).send('El ID del alumno ó el ID del evento no existen o no son correctos.');
    const alumnosInscritos = eventos[evento.id - 1].alumnosInscritos;
    // verificamos si es que el estudiante ya está inscrito al evento deseado
    if(alumnosInscritos.includes(estudiante.id))
        return res.status(400).send('El alumno ya está inscrito en el evento.');
    // si no está inscrito, lo añadimos al array que contiene los id de los alumnos inscritos
    evento.alumnosInscritos.push(estudiante.id);
    res.status(200).send(`ID Evento: ${evento.id} \nID alumnos inscritos:\n ${alumnosInscritos}`);
});

// función para eliminar a un alumno inscrito a un evento dado el id del alumno y el id del evento
ruta.delete('/estudiantesInscritos/:idEvento/:idEstudiante', (req, res) => {
    const evento = existeEvento(req.params.idEvento);
    const estudiante = alumnos.existeEstudiante(req.params.idEstudiante);
    if(!(evento && estudiante))
        return res.status(404).send('El ID del alumno ó el ID del evento no existen o no son correctos.');
    const alumnosInscritos = eventos[evento.id - 1].alumnosInscritos;
    // verificamos si el alumno realmente está inscrito al evento
    if(!alumnosInscritos.includes(estudiante.id))
        return res.status(400).send('El alumno no está inscrito en el evento.'); 
    // obtenemos el ID dentro del array de alumnos inscritos, para posteriormente eliminarlo
    alumnosInscritos.splice(alumnosInscritos.indexOf(estudiante.id), 1);
    res.status(200).send(`ID Evento: ${evento.id} \nID alumnos inscritos:\n ${alumnosInscritos}`);
});

// definimos el objet con las funciones ruta como el array eventos, para poder utilizarlo en estudiantes.js
const objetoEventos = {
    ruta,
    eventos
};

// exportamos el objeto posteriormente definido
module.exports = objetoEventos; 