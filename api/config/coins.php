<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Coin Purchase Rate
    |--------------------------------------------------------------------------
    |
    | This value determines how many coins a user receives per euro spent.
    | For example, a rate of 10 means €1.00 = 10 coins.
    |
    */

    'purchase_rate' => env('COIN_PURCHASE_RATE', 10),

    /*
    |--------------------------------------------------------------------------
    | Welcome Bonus
    |--------------------------------------------------------------------------
    |
    | The number of coins awarded to new users upon registration.
    |
    */

    'welcome_bonus' => env('COIN_WELCOME_BONUS', 10),

];
