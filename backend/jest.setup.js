// Las pruebas corren contra la base de datos real de pruebas
// (`comproya_test`), nunca contra la de desarrollo — ver .env.test.
require("dotenv").config({ path: require("path").resolve(__dirname, ".env.test") });
