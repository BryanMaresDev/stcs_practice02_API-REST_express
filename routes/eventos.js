const express = require('express'); //Importamos express
const joi = require('joi');         //Importamos Joi para validar los datos ingresados por el usuario
const ruta = express.Router();      //Creamos un objeto Router de Express para manejar las rutas

const alumnos = require('./estudiantes');

const eventos = [];    

function existeEvento(id) {                                 
    return (eventos.find( evento => evento.id === parseInt(id)));
}

function validarFecha(evento) {    
    const eventoMismaFecha = eventos.find((event) => {
        return event.fecha === evento.fecha && 
               event.hora === evento.hora && 
               event.lugar === evento.lugar
    });

    return !eventoMismaFecha;
}

function validarEvento(evento) {    
    const schema = joi.object({
        titulo: joi.string()
                   .min(7)
                   .required(),
        fecha:  joi.string()
                   .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/)
                   .required(),
        hora:   joi.string()
                   .regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/)
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

ruta.get('/', (req, res) => {
    if (eventos.length == 0)
        return res.status(404).send('No hay eventos creados');
    res.send(eventos);
});

ruta.get('/:id', (req, res) => {                   
    const id = req.params.id;                      
    let evento = existeEvento(id);                 
    if (!evento)                               
        res.status(404).send(`El evento ${id} no se encuentra`);
    res.send(evento);                              
});  

ruta.post('/', (req, res) => {                      
    const {error} = validarEvento(req.body);  

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
        if (validarFecha(evento)){                              
            eventos.push(evento);
            res.send(evento);
        }                                            
        return res.status(400).send('Ya existe un evento con la misma fecha, hora y lugar');
    }                                     
    return res.status(400).send(error);
});

ruta.put('/:id', (req, res) => {
    let evento = existeEvento(req.params.id);
    if (!evento){
        return res.status(404).send('El evento no se encuentra'); 
    }
    const {error} = validarEvento(req.body);
    if (!error) {
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

ruta.delete('/:id', (req, res) => {
    const evento = existeEvento(req.params.id);
    if (!evento) 
        return res.status(404).send('El evento no se encuentra');
    const index = eventos.indexOf(evento);
    eventos.splice(index, 1);      
    res.send(evento);
});

/* ----- */

ruta.get('/estudiantesInscritos/:idEvento', (req, res) => {
    if (eventos.length == 0)
        return res.status(404).send('No hay eventos creados aún.');
    const evento = existeEvento(req.params.idEvento);
    if(evento === undefined)
        return res.status(404).send('Este evento no existe.');
    const alumnosInscritos = eventos[evento.id - 1].alumnosInscritos;
    if (alumnosInscritos.length == 0) {
        return res.status(404).send('No hay alumnos inscritos al evento.');
    }
    res.status(200).send(`ID Evento: ${evento.id} \nID alumnos inscritos:\n ${alumnosInscritos}`);
});

ruta.post('/estudiantesInscritos/:idEvento/:idEstudiante', (req, res) => {
    const evento = existeEvento(req.params.idEvento);
    const estudiante = alumnos.existeEstudiante(req.params.idEstudiante);
    if(!(evento && estudiante))
        return res.status(404).send('El ID del alumno ó el ID del evento no existen o no son correctos.');
    const alumnosInscritos = eventos[evento.id - 1].alumnosInscritos;
    if(alumnosInscritos.includes(estudiante.id))
        return res.status(400).send('El alumno ya está inscrito en el evento.');
    evento.alumnosInscritos.push(estudiante.id);
    res.status(200).send(`ID Evento: ${evento.id} \nID alumnos inscritos:\n ${alumnosInscritos}`);
});

ruta.delete('/estudiantesInscritos/:idEvento/:idEstudiante', (req, res) => {
    const evento = existeEvento(req.params.idEvento);
    const estudiante = alumnos.existeEstudiante(req.params.idEstudiante);
    if(!(evento && estudiante))
        return res.status(404).send('El ID del alumno ó el ID del evento no existen o no son correctos.');
    const alumnosInscritos = eventos[evento.id - 1].alumnosInscritos;
    if(!alumnosInscritos.includes(estudiante.id))
        return res.status(400).send('El alumno no está inscrito en el evento.'); 
    alumnosInscritos.splice(alumnosInscritos.indexOf(estudiante.id), 1);
    res.status(200).send(`ID Evento: ${evento.id} \nID alumnos inscritos:\n ${alumnosInscritos}`);
});

const objetoEventos = {
    ruta,
    eventos
};

module.exports = objetoEventos; 