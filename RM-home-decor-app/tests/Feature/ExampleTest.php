<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_a_successful_response()
    {
        $response = $this->get(route('home'));

        $response->assertOk();
    }

    public function test_old_urls_redirect_permanently_to_the_new_ones(): void
    {
        $this->get('/calculo-de-preco')->assertStatus(301)->assertRedirect('/calculos-de-preco');
        $this->get('/registros-de-vendas')->assertStatus(301)->assertRedirect('/vendas');
    }
}
