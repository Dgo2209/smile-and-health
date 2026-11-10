
Universidad Autónoma de la Ciudad de México

Análisis y Modelamiento de software.

Tercera entrega Fase de Construcción.
Sistema de control odontológico.
Contenido
Tercera entrega Fase de Construcción.	
Sistema de control odontológico.	
Justificación del lenguaje de programación	
Descripción de la arquitectura.	
Código Fuente.
Conclusiones.	
Justificación del lenguaje de programación
¿Por qué se seleccionó ese lenguaje de programación?
Para desarrollar el SIGO (Sistema Integral de Gestión Odontológica) se eligieron el uso de HTML5, CSS3, y JavaScript, dado que permiten construir aplicaciones web dinámicas, interactivas y con compatibilidad dentro de los navegadores existentes.
•	HTML5: Usada para definir la estructura y organización de los elementos de la aplicación, como son los menús, los formularios, así como tablas, ventanas o módulos.
•	CSS3: Usado para el diseño de la interfaz gráfica, estableciendo estilos, distribución de componentes y adaptación de la presentación según el tamaño del dispositivo.
•	JavaScript: Lenguaje empleado para la implementación de la lógica del funcionamiento de la aplicación, permitiendo la interacción con el usuario, validación de formularios, control de módulos, el odontograma, así como la evolución clínica y los consentimientos informados.
Así mismo se hace uso de SQL para la definición y administración de la base de datos mediante PostgreSQL, proporcionado por Supabase.
Esto se utiliza para poder tener una compatibilidad con los navegadores, la integración en base a su gran facilidad, disposición de herramientas, así como la capacidad de crear una aplicación modular sin necesidad de software adicional.
Descripción de la arquitectura.
El proyecto utiliza una arquitectura cliente – servidor con enfoque a una aplicación web, en la cual los usuarios interactúan con el sistema mediante un navegador, así mismo los servicios de almacenamiento y gestión de información se proporcionan mediante Supabase.
Organización de la arquitectura.
Cliente o Frontend : Corresponde a la interfaz web desarrollada con HMTL5, CSS y JS, donde es responsable de presentar las funciones del sistema y permitir la interacción del usuario con diferentes módulos .
Lógica: Se implementa mediante módulos de JS independientes, encargados con las tareas de gestionar las funcionalidades dentro del sistema, facilitando el mantenimiento y modificación de cada componente.
Servidor y servicio de Backend: Se hace uso de Supabase como plataforma de backend, donde proporciona el servicio de autenticación, comunicación y administración por medio de su API .
Base de datos: Se emplea PostgreSQL, por medio de Supabase para el almacenamiento y organización de la información correspondiente a los registros que van dentro del sistema, contemplando políticas de seguridad para un control de acceso a los datos.
Despliegue: La aplicación se publica mediante GitHub Pages, lo que permite acceder al frontend desde un navegador con conexión a Internet. Supabase proporciona los servicios de backend de manera independiente.
El funcionamiento general consiste en que el usuario accede a la aplicación desde su navegador, interactúa con la interfaz y realiza operaciones sobre los diferentes módulos. Cuando se requiere consultar o almacenar información, JavaScript establece comunicación con los servicios de Supabase, que procesan las solicitudes y permiten recuperar o persistir los datos correspondientes.

Conclusiones.
Desde la experiencia de desarrollar el proyecto de SIGO, con los avances hasta el momento, siendo la tercera das, trabajar con PUDS ha permitido la organización de forma estructurada las actividades que se necesitan llevar a cabo pues la construcción del sistema por medio del desarrollo de etapas, estableciendo objetivos específicos evaluando los resultados que se van obteniendo.
Una gran ventaja de utilizar PUDS es que tiene un enfoque iterativo e incremental, dado que podemos desarrollar, así como revisar las funcionalidades del sistema de  una manera gradual, viéndolo desde el punto del SIGO permitiendo la organización de los módulos, dado que emos podido identificar necesidades, ajustes e incluso mantener una visión general de la arquitectura del proyecto.
Por otra parte, consideramos que la metodología requiere una adecuada planificación y documentación, debido a que cada fase implica analizar los avances anteriores y tomar decisiones que pueden influir en las siguientes etapas.
Finalmente, concluimos que la aplicación del PUDS ha contribuido a comprender que el desarrollo de software no consiste únicamente en programar, sino también en analizar los requerimientos, diseñar una arquitectura, planificar las actividades, documentar las decisiones y evaluar continuamente los resultados.
