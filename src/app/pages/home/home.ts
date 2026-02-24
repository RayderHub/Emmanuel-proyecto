import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [RouterLink, ButtonModule],
    templateUrl: './home.html',
    styleUrl: './home.css'
})
export class Home { }
