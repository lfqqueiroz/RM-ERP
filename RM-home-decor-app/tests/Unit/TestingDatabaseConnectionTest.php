<?php

namespace Tests\Unit;

use Tests\TestCase;

class TestingDatabaseConnectionTest extends TestCase
{
    /**
     * Garante que a suíte de testes nunca rode contra o banco configurado em
     * DB_CONNECTION do ambiente (ex.: MySQL do docker-compose). O phpunit.xml
     * define DB_CONNECTION=sqlite com force="true" em <env> e <server>; sem
     * isso, o ambiente do container sobrescreveria o valor e o
     * RefreshDatabase executaria migrate:fresh no banco de desenvolvimento.
     */
    public function test_tests_run_against_an_in_memory_sqlite_database(): void
    {
        $this->assertSame('sqlite', config('database.default'));
        $this->assertSame(':memory:', config('database.connections.sqlite.database'));
    }
}
