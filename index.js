const { ApolloServer, gql, PubSub, withFilter } = require('apollo-server');

let employees = [
  {
    id: 1,
    name: 'John Smith',
    employerId: 1,
  },
  {
    id: 2,
    name: 'Lauren Armstrong',
    employerId: 1,
  },
  {
    id: 3,
    name: 'Henry Bautista',
    employerId: 1,
  },
  {
    id: 4,
    name: 'Jake Snarl',
    employerId: 2,
  },
];

let employers = [
  {
    id: 1,
    name: 'Harrys pub',
  },
  {
    id: 2,
    name: 'UPS',
  },
];

const typeDefs = gql`
  type Query {
    employers: [Employer]
    employees: [Employee]
    employer(id: Int): Employer
    employee(id: Int): Employee
  }

  type Employer {
    id: Int
    name: String
    employees: [Employee]
    numEmployees: Int
  }

  type Employee {
    id: Int
    name: String
    employer: Employer
  }

  type Mutation {
    addEmployee(name: String!, employerId: Int!): Employee
    removeEmployee(id: Int!): [Employee]
    changeEmployeeName(id: Int!, name: String!): Employee
    changeEmployer(id: Int!, employerId: Int!): Employee
  }

  type Subscription {
    newEmployee(employerId: Int): Employee
  }
`;

const pubsub = new PubSub();

// subscription tag
const NEW_EMPLOYEE = 'NEW_EMPLOYEE';

const resolvers = {
  Subscription: {
    newEmployee: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([NEW_EMPLOYEE]),
        (payload, args) => {
          return (!args.employerId || payload.newEmployee.employerId === args.employerId)
        },
      ),
      resolve: (payload) => ({
        id: payload.newEmployee.id,
        name: `${payload.newEmployee.name}, phD`,
        employerId: payload.newEmployee.employerId,
        
      })
    },
  },
  Query: {
    employer: (_, args) => employers.filter(e => e.id === args.id)[0],
    employee: (_, args) => employees.filter(e => e.id === args.id)[0],
    employers: () => employers,
    employees: () => employees,
  },
  Employer: {
    numEmployees: (parentValue) => {
      console.log('parentValue in Employer: ', parentValue);
      return employees.filter(e => e.employerId === parentValue.id).length;
    },
    employees: (parentValue) => {
      return employees.filter(e => e.employerId === parentValue.id);
    },
  },
  Employee: {
    employer: (parentValue) => {
      return employers.filter(e => e.id === parentValue.employerId)[0];
    },
  },
  Mutation: {
    addEmployee: (_, args) => {
      const newEmployee = {
        id: employees.length + 1,
        name: args.name,
        employerId: args.employerId,
      };
      pubsub.publish(NEW_EMPLOYEE, { newEmployee });
      employees.push(newEmployee);
      return newEmployee;
    },
    removeEmployee: (_, args) => {
      return employees.filter(e => e.id !== args.id)
    },
    changeEmployeeName: (_, args) => {
      let newEmployee;
      // Change employees
      employees = employees.map(e => {
        if(e.id === args.id) {
          newEmployee = {
            ...e,
            name: args.name,
          };
          return newEmployee
        };
        return e;
      });
      // Return change employee
      return newEmployee;
    },
    changeEmployer: (_, args) => {
      let newEmployee;
      // Change employees
      employees = employees.map(e => {
        if(e.id === args.id) {
          newEmployee = {
            ...e,
            employerId: args.employerId,
          };
          return newEmployee
        };
        return e;
      });
      // Return change employee
      return newEmployee;
    },

  }
}

const server = new ApolloServer({ typeDefs, resolvers })

server.listen().then(({ url }) => {
  console.log(`Server is ready at ${url}`)
});
