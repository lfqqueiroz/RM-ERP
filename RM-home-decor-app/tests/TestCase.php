<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Fortify\Features;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    /**
     * Cria a aplicação garantindo que a suíte nunca rode contra o banco de
     * desenvolvimento.
     *
     * O phpunit.xml força SQLite em memória (em <env> e <server>, pois o
     * docker-compose define DB_CONNECTION=mysql no container). Esta trava é
     * uma segunda camada: se a configuração for contornada (ex.: config em
     * cache), o trait RefreshDatabase executaria migrate:fresh no MySQL e
     * apagaria os dados. A verificação acontece antes de setUpTraits(),
     * portanto antes de qualquer migração destrutiva.
     */
    public function createApplication()
    {
        $app = parent::createApplication();

        $connection = $app['config']->get('database.default');
        $database = $app['config']->get("database.connections.{$connection}.database");

        if ($connection !== 'sqlite' || $database !== ':memory:') {
            throw new RuntimeException(
                'Os testes precisam rodar em SQLite em memória (DB_CONNECTION=sqlite e '
                ."DB_DATABASE=:memory:). Configuração atual: conexão [{$connection}] e banco "
                ."[{$database}]. Verifique o phpunit.xml e rode `php artisan config:clear`; "
                .'o RefreshDatabase apagaria o banco de desenvolvimento.'
            );
        }

        return $app;
    }

    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }
}
