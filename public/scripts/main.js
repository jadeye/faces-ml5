require.config({
    paths: {
        'fontawesome': '../fontawesome/fontawesome.min',
        'fontawesome/solid': '../fontawesome/solid.min',
        'fontawesome/brands': '../fontawesome/brands.min'
    },
    shim: {
        'fontawesome': {
            deps: ['fontawesome/solid', 'fontawesome/brands']
        }
    }
})

require(['fontawesome'], function (fontawesome) {
    console.log('Congrats, Font Awesome is installed using Require.js')
})