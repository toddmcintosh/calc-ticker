<?php

namespace App\Math;

class MathEngine
{
    public function evaluate(string $expression): string
    {
        $expression = trim($expression);

        $this->guard($expression);

        $tokens = (new Tokenizer())->tokenize($expression);
        $rpn    = (new ShuntingYard())->toRpn($tokens);
        $value  = (new RpnEvaluator())->evaluate($rpn);

        return $this->format($value);
    }

    private function guard(string $expression): void
    {
        if (!preg_match('/^(?:sqrt|[0-9+\-*\/\^().\s])+$/', $expression)) {
            throw new \InvalidArgumentException('Invalid characters in expression');
        }
    }

    private function format(float $value): string
    {
        if (!is_finite($value)) {
            throw new \InvalidArgumentException('Expression resulted in a non-finite value');
        }

        $int = (int) $value;
        if (abs($value - $int) < 1e-12) {
            return (string) $int;
        }

        return rtrim(rtrim(sprintf('%.12F', $value), '0'), '.');
    }
}
