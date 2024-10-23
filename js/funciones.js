// Definir la función de retraso al principio
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let facturas = [];
let currentPage = 1;
const itemsPerPage = 5;

document.addEventListener("DOMContentLoaded", function () {
    cargarFacturasDesdeAirtable();
});

async function cargarFacturasDesdeAirtable() {
    console.log('Iniciando carga de facturas desde Airtable...');

    // Añadir un retraso antes de realizar la solicitud a Airtable
    await delay(1000); // 1000 milisegundos = 1 segundo

    fetch('https://cors-anywhere.herokuapp.com/https://api.airtable.com/v0/appVnUZtXAzJ2cXt0/CPA04(factura)', {
        headers: {
            'Authorization': 'Bearer patOUpJLbLWULhDEJ.f14f2b00ac242288345a87fe0fe2e4cc4d68ba152eb615963a321200c5aa8e1e'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Datos recibidos de Airtable:', data);
        facturas = data.records;
        mostrarFacturas();
    })
    .catch(error => {
        console.error('Error al cargar las facturas desde Airtable:', error);
        toastr.error(`Error al cargar las facturas: ${error.message}`);
    });
}

function mostrarFacturas() {
    const facturasListado = document.getElementById('facturas-listado');
    facturasListado.innerHTML = ''; // Limpiar listado antes de agregar nuevas facturas
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const facturasPaginadas = facturas.slice(startIndex, endIndex);

    facturasPaginadas.forEach(record => {
        const facturaId = record.id;
        const proveedor = record.fields.N_COMP || 'No disponible';
        const ncompInC = record.fields.NCOMP_IN_C;

        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item');
        listItem.innerHTML = `${proveedor} <button class="btn btn-link float-end" onclick="verFactura('${facturaId}', '${ncompInC}', '${proveedor}')">Ver</button>`;
        facturasListado.appendChild(listItem);
    });

    actualizarPaginacion();
}

function actualizarPaginacion() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    const totalPages = Math.ceil(facturas.length / itemsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.classList.add('page-item');
        if (i === currentPage) {
            pageItem.classList.add('active');
        }
        const pageLink = document.createElement('a');
        pageLink.classList.add('page-link');
        pageLink.href = '#';
        pageLink.textContent = i;
        pageLink.onclick = function (e) {
            e.preventDefault();
            currentPage = i;
            mostrarFacturas();
        };
        pageItem.appendChild(pageLink);
        pagination.appendChild(pageItem);
    }
}

function buscarFactura() {
    const searchTerm = document.getElementById('search-bar').value.toLowerCase();
    const facturasListado = document.getElementById('facturas-listado');
    facturasListado.innerHTML = '';
    const facturasFiltradas = facturas.filter(record => record.fields.N_COMP.toLowerCase().includes(searchTerm));
    facturasFiltradas.slice(0, itemsPerPage).forEach(record => {
        const facturaId = record.id;
        const proveedor = record.fields.N_COMP;
        const ncompInC = record.fields.NCOMP_IN_C;

        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item');
        listItem.innerHTML = `${proveedor} <button class="btn btn-link float-end" onclick="verFactura('${facturaId}', '${ncompInC}', '${proveedor}')">Ver</button>`;
        facturasListado.appendChild(listItem);
    });
}

function verFactura(id, ncompInC, proveedor) {
    console.log(`Cargar detalles de la factura con ID: ${id}`);
    const invoicesList = document.getElementById('invoices-list');
    invoicesList.innerHTML = ''; // Limpiar el contenedor de facturas antes de agregar la nueva factura
    let invoiceCard = document.createElement('div');
    invoiceCard.classList.add('invoice-card');
    invoiceCard.id = `factura-${id}`;
    invoiceCard.innerHTML = `
<div class="invoice-header">
    <h4>Factura: ${proveedor}</h4>
    <div>
        <button class="btn btn-primary me-2" onclick="mostrarFormularioEdicion('${id}', '${ncompInC}')"><i class="fas fa-edit"></i> Editar</button>
        <button class="btn btn-success me-2" onclick="aceptarFactura('${id}')"><i class="fas fa-check"></i> Aceptar</button>
        <button class="btn btn-danger" onclick="eliminarFactura('${id}')"><i class="fas fa-trash"></i> Eliminar</button>
    </div>
</div>
<p><strong>Cliente:</strong> <span id="cliente-${id}">Cliente desconocido</span></p>
<p><strong>Fecha:</strong> <span id="fecha-${id}">Fecha desconocida</span></p>
<table>
    <thead>
        <tr>
            <th>#</th>
            <th>Código</th>
            <th>Cant.</th>
            <th>Descripción</th>
            <th>Precio</th>
            <th>Descuento</th>
            <th>Importe</th>
        </tr>
    </thead>
    <tbody id="productos-${id}">
        <!-- Productos cargados dinámicamente -->
    </tbody>
</table>
<div class="totals-section">
    <p><strong>Subtotal:</strong> $<span id="subtotal-${id}">0</span></p>
    <p><strong>IVA 21%:</strong> $<span id="iva-${id}">0</span></p>
    <p><strong>Total:</strong> $<span id="total-${id}">0</span></p>
</div>
<div id="formulario-edicion-${id}" style="display: none;" class="formulario-edicion mt-4">
    <h5>Editar Factura ${proveedor}</h5>
    <div class="mb-3">
        <label for="cliente-input-${id}" class="form-label">Cliente</label>
        <input type="text" class="form-control" id="cliente-input-${id}" value="">
    </div>
    <div class="mb-3">
        <label for="fecha-input-${id}" class="form-label">Fecha</label>
        <input type="date" class="form-control" id="fecha-input-${id}" value="">
    </div>
    <table class="table">
        <thead>
            <tr>
                <th>#</th>
                <th>Código</th>
                <th>Cant.</th>
                <th>Descripción</th>
                <th>Precio</th>
                <th>Descuento</th>
                <th>Importe</th>
            </tr>
        </thead>
        <tbody id="productos-input-container-${id}">
            <!-- Productos cargados dinámicamente -->
        </tbody>
    </table>
    <div class="mb-3">
        <label for="subtotal-input-${id}" class="form-label">Subtotal</label>
        <input type="text" class="form-control" id="subtotal-input-${id}" value="">
    </div>
    <div class="mb-3">
        <label for="iva-input-${id}" class="form-label">IVA 21%</label>
        <input type="text" class="form-control" id="iva-input-${id}" value="">
    </div>
    <div class="mb-3">
        <label for="total-input-${id}" class="form-label">Total</label>
        <input type="text" class="form-control" id="total-input-${id}" value="">
    </div>
    <div class="btn-container">
<button class="btn btn-secondary mb-3" onclick="agregarProducto('${id}')"><i class="fas fa-plus"></i> Agregar Producto</button>
<button class="btn btn-primary me-2" onclick="guardarCambios('${id}', '${ncompInC}')">Guardar Cambios</button>
<button class="btn btn-danger" onclick="cancelarEdicion('${id}')">Cancelar</button>
</div>
</div>
`;
    invoicesList.appendChild(invoiceCard);
    cargarProductosRelacionados(ncompInC, id);
    cargarTotalesFactura(ncompInC, id);
}

function cancelarEdicion(id) {
    console.log(`Cancelando edición para la factura con ID: ${id}`);

    const formulario = document.getElementById(`formulario-edicion-${id}`);
    const invoiceCard = document.getElementById(`factura-${id}`);

    if (!formulario || !invoiceCard) {
        console.error(`No se pudo encontrar el formulario de edición o la tarjeta de la factura para la factura con ID: ${id}`);
        return;
    }

    // Ocultar el formulario de edición
    formulario.style.display = 'none';

    // Mostrar de nuevo el detalle de la factura
    invoiceCard.querySelector('.invoice-header').style.display = 'flex';
    invoiceCard.querySelector('table').style.display = 'table';
    invoiceCard.querySelector('.totals-section').style.display = 'flex';
}

function cargarProductosRelacionados(ncompInC, facturaId) {
    console.log(`Cargando productos relacionados para NCOMP_IN_C: ${ncompInC}`);
    fetch(`https://cors-anywhere.herokuapp.com/https://api.airtable.com/v0/appVnUZtXAzJ2cXt0/CPA46(detalle)?filterByFormula=NCOMP_IN_C='${ncompInC}'`, {
        headers: {
            'Authorization': 'Bearer patOUpJLbLWULhDEJ.f14f2b00ac242288345a87fe0fe2e4cc4d68ba152eb615963a321200c5aa8e1e'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Productos relacionados recibidos de Airtable:', data);
        const productosList = document.getElementById(`productos-${facturaId}`);
        const productosInputContainer = document.getElementById(`productos-input-container-${facturaId}`);
        if (!productosList || !productosInputContainer) {
            console.error(`No se pudo encontrar el elemento productos-${facturaId} o productos-input-container-${facturaId}`);
            return;
        }
        productosList.innerHTML = ''; // Limpiar antes de agregar productos
        productosInputContainer.innerHTML = ''; // Limpiar antes de agregar productos en el formulario de edición
        let subtotal = 0;
        let productCounter = 1;
        data.records.forEach(producto => {
            const productoId = producto.id;
            const productoCodigo = producto.fields.COD_ARTICU || 'Código no disponible';
            const productoImporte = parseFloat(producto.fields.IMP_NETO_P || 0);
            const productoDescripcion = producto.fields.DESCRIPCION || 'Descripción no disponible';
            const productoCantidad = producto.fields.Cantidad || 'Cantidad no disponible';
            const productoPrecio = parseFloat(producto.fields.PRECIO_PAN || 0);
            const productoDescuento = producto.fields.PORCE_DCTO || 'Descuento no disponible';
            const importeConFormato = (productoImporte).toLocaleString('es-ES');
            const precioConFormato = (productoPrecio).toLocaleString('es-ES');
            subtotal += productoImporte;
            const row = document.createElement('tr');
            row.innerHTML = `<td>${productCounter}</td><td>${productoCodigo}</td><td>${productoCantidad}</td><td>${productoDescripcion}</td><td>$${precioConFormato}</td><td>${productoDescuento}%</td><td>$${importeConFormato}</td>`;
            productosList.appendChild(row);
            productCounter++;

            // Añadir campo de producto editable en el formulario de edición
            const productRow = document.createElement('tr');
            productRow.innerHTML = `
            <td>${productCounter - 1}</td>
            <td><input type="text" class="form-control mb-1" value="${productoCodigo}" data-product-id="${productoId}" id="producto-codigo-${facturaId}-${productCounter}" placeholder="Codigo"></td>
            <td><input type="text" class="form-control mb-1" value="${productoCantidad}" id="producto-cantidad-${facturaId}-${productCounter}" placeholder="Cant."></td>
            <td><input type="text" class="form-control mb-1" value="${productoDescripcion}" id="producto-descripcion-${facturaId}-${productCounter}" placeholder="Descripción"></td>
            <td><input type="text" class="form-control mb-1" value="${precioConFormato}" id="producto-precio-${facturaId}-${productCounter}" placeholder="Precio"></td>
            <td><input type="text" class="form-control mb-1" value="${productoDescuento}" id="producto-descuento-${facturaId}-${productCounter}" placeholder="Descuento"></td>
            <td><input type="text" class="form-control mb-1" value="${importeConFormato}" id="producto-importe-${facturaId}-${productCounter}" placeholder="Importe"></td>
        `;
            productosInputContainer.appendChild(productRow);
        });
        document.getElementById(`subtotal-input-${facturaId}`).value = subtotal.toLocaleString('es-ES');
        document.getElementById(`subtotal-${facturaId}`).innerText = subtotal.toLocaleString('es-ES');
    })
    .catch(error => {
        console.error('Error al cargar los productos relacionados desde Airtable:', error);
        toastr.error(`Error al cargar los productos relacionados: ${error.message}`);
    });
}

function cargarTotalesFactura(ncompInC, facturaId) {
    console.log(`Cargando totales de la factura para NCOMP_IN_C: ${ncompInC}`);
    fetch(`https://cors-anywhere.herokuapp.com/https://api.airtable.com/v0/appVnUZtXAzJ2cXt0/CPA04(factura)?filterByFormula=NCOMP_IN_C='${ncompInC}'`, {
        headers: {
            'Authorization': 'Bearer patOUpJLbLWULhDEJ.f14f2b00ac242288345a87fe0fe2e4cc4d68ba152eb615963a321200c5aa8e1e'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Totales de la factura recibidos de Airtable:', data);
        if (data.records.length > 0) {
            const factura = data.records[0].fields;
            const subtotal = parseFloat(factura.IMPORTE_NE || 0).toLocaleString('es-ES');
            const iva = parseFloat(factura.IMP_IVA1 || 0).toLocaleString('es-ES');
            const total = parseFloat(factura.IMPORTE_TO || 0).toLocaleString('es-ES');
            document.getElementById(`subtotal-input-${facturaId}`).value = subtotal;
            document.getElementById(`iva-input-${facturaId}`).value = iva;
            document.getElementById(`total-input-${facturaId}`).value = total;
            document.getElementById(`subtotal-${facturaId}`).innerText = subtotal;
            document.getElementById(`iva-${facturaId}`).innerText = iva;
            document.getElementById(`total-${facturaId}`).innerText = total;
        }
    })
    .catch(error => {
        console.error('Error al cargar los totales de la factura desde Airtable:', error);
        toastr.error(`Error al cargar los totales de la factura: ${error.message}`);
    });
}

function mostrarFormularioEdicion(id, ncompInC) {
    console.log(`Mostrando formulario de edición para la factura con ID: ${id}`);

    const formulario = document.getElementById(`formulario-edicion-${id}`);
    const invoiceCard = document.getElementById(`factura-${id}`);

    if (!formulario || !invoiceCard) {
        console.error(`No se pudo encontrar el formulario de edición o la tarjeta de la factura para la factura con ID: ${id}`);
        return;
    }

    if (formulario.style.display === 'none' || formulario.style.display === '') {
        formulario.style.display = 'block';
        invoiceCard.querySelector('.invoice-header').style.display = 'none';
        invoiceCard.querySelector('table').style.display = 'none';
        invoiceCard.querySelector('.totals-section').style.display = 'none';
    } else {
        formulario.style.display = 'none';
        invoiceCard.querySelector('.invoice-header').style.display = 'flex';
        invoiceCard.querySelector('table').style.display = 'table';
        invoiceCard.querySelector('.totals-section').style.display = 'flex';
    }
}

function guardarCambios(id, ncompInC) {
    console.log(`Guardando cambios para la factura con ID: ${id}`);

    const cliente = document.getElementById(`cliente-input-${id}`).value;
    const fecha = document.getElementById(`fecha-input-${id}`).value;

    const subtotal = parseFloat(document.getElementById(`subtotal-input-${id}`).value.replace(/,/g, '')) || 0;
    const iva = parseFloat(document.getElementById(`iva-input-${id}`).value.replace(/,/g, '')) || 0;
    const total = parseFloat(document.getElementById(`total-input-${id}`).value.replace(/,/g, '')) || 0;

    const productosElements = document.querySelectorAll(`#productos-input-container-${id} tr`);
    const productos = Array.from(productosElements).map(item => {
        const codigo = item.querySelector('input[placeholder="Codigo"]').value;
        const productoId = item.querySelector('input[placeholder="Codigo"]').getAttribute('data-product-id');
        const descripcion = item.querySelector('input[placeholder="Descripción"]').value;
        const cantidad = parseFloat(item.querySelector('input[placeholder="Cant."]').value.replace(/,/g, '')) || 0;
        const precio = parseFloat(item.querySelector('input[placeholder="Precio"]').value.replace(/,/g, '')) || 0;
        const descuento = parseFloat(item.querySelector('input[placeholder="Descuento"]').value.replace(/,/g, '')) || 0;

        return {
            id: productoId,
            COD_ARTICU: codigo,
            DESCRIPCION: descripcion,
            Cantidad: cantidad,
            PRECIO_PAN: precio,
            PORCE_DCTO: descuento
        };
    }).filter(value => value.COD_ARTICU.trim() !== '');

    console.log(`Datos a guardar - Cliente: ${cliente}, Fecha: ${fecha}, Subtotal: ${subtotal}, IVA: ${iva}, Total: ${total}, Productos: ${JSON.stringify(productos)}`);

    document.getElementById(`cliente-${id}`).innerText = cliente;
    document.getElementById(`fecha-${id}`).innerText = fecha;
    document.getElementById(`subtotal-${id}`).innerText = subtotal.toLocaleString('es-ES');
    document.getElementById(`iva-${id}`).innerText = iva.toLocaleString('es-ES');
    document.getElementById(`total-${id}`).innerText = total.toLocaleString('es-ES');
    document.getElementById(`productos-${id}`).innerHTML = productos.map((p, index) =>
        `<tr><td>${index + 1}</td><td>${p.COD_ARTICU}</td><td>${p.Cantidad}</td><td>${p.DESCRIPCION}</td><td>$${p.PRECIO_PAN.toLocaleString('es-ES')}</td><td>${p.PORCE_DCTO}%</td><td>$${(p.PRECIO_PAN * p.Cantidad).toLocaleString('es-ES')}</td></tr>`
    ).join('');

    actualizarProductoEnAirtable(productos);
    mostrarFormularioEdicion(id);
}

function actualizarProductoEnAirtable(productos) {
    console.log(`Actualizando productos en Airtable`);

    if (productos.length === 0) {
        console.error('No hay productos para actualizar.');
        return;
    }

    let productosActualizados = 0;

    productos.forEach(producto => {
        fetch(`https://cors-anywhere.herokuapp.com/https://api.airtable.com/v0/appVnUZtXAzJ2cXt0/CPA46(detalle)/${producto.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer patOUpJLbLWULhDEJ.f14f2b00ac242288345a87fe0fe2e4cc4d68ba152eb615963a321200c5aa8e1e'
            },
            body: JSON.stringify({
                fields: {
                    COD_ARTICU: producto.COD_ARTICU,
                    DESCRIPCION: producto.DESCRIPCION,
                    Cantidad: producto.Cantidad,
                    PRECIO_PAN: producto.PRECIO_PAN,
                    PORCE_DCTO: producto.PORCE_DCTO
                }
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error en la actualización: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Producto actualizado en Airtable:', data);
            productosActualizados++;

            if (productosActualizados === productos.length) {
                toastr.success('Todos los cambios han sido guardados exitosamente.', '', { timeOut: 2000, extendedTimeOut: 1000 });
            }
        })
        .catch(error => {
            console.error('Error al actualizar el producto en Airtable:', error);
            toastr.error('Error al actualizar el producto.');
        });
    });
}

function aceptarFactura(id) {
    console.log(`Aceptando factura con ID: ${id}`);
    alert('Factura #' + id + ' aceptada.');
}

function eliminarFactura(id) {
    console.log(`Eliminando factura con ID: ${id}`);
    if (confirm('¿Estás seguro de que deseas eliminar esta factura?')) {
        fetch(`https://cors-anywhere.herokuapp.com/https://api.airtable.com/v0/appVnUZtXAzJ2cXt0/CPA04(factura)/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer patOUpJLbLWULhDEJ.f14f2b00ac242288345a87fe0fe2e4cc4d68ba152eb615963a321200c5aa8e1e'
            }
        })
        .then(response => {
            if (response.ok) {
                console.log('Factura eliminada exitosamente.');
                document.getElementById(`factura-${id}`).remove();
                toastr.success('Factura eliminada exitosamente.');
            } else {
                toastr.error('Error al eliminar la factura.');
            }
        })
        .catch(error => {
            console.error('Error al eliminar la factura en Airtable:', error);
            toastr.error('Error al eliminar la factura.');
        });
    }
}