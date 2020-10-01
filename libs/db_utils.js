function addConstraints(queryInterface, table_name, constraints){
    return Promise.all(
        Object.entries(constraints).map(([ name, definition ]) => queryInterface
            .addConstraint(table_name, { ...definition, fields: [ name ], name: `${table_name}_${ name }_FK` }
        ))
    );
}

function removeConstraints(queryInterface, table_name, constraints){
    return Promise.all(
        Object.entries(constraints).map(([ name ]) => queryInterface
            .removeConstraint(table_name, `${table_name}_${ name }_FK`))
    );
}

module.exports = { addConstraints, removeConstraints };

