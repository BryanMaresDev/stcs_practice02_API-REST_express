const estudiantes = require('./routes/estudiantes');
const eventos = require('./routes/eventos');

const express = require('express');
const app = express();
const joi = require('joi');

app.use(express.json());                        // Le decimos a express que use este middleware
app.use(express.urlencoded({extended:true}));   // Define el uso de la libreria qs para separar la información codificada en el url 
app.use('/api/estudiantes', estudiantes.ruta);
app.use('/api/eventos', eventos.ruta);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Escuchando en el puerto ${port}`);
});