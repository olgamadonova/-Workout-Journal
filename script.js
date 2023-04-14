const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} ${months[this.date.getMonth()]} - ${this.date.getDate()}`
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace () {
    this.pace = this.duration/this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance/(this.duration/60);
    return this.speed;
  }
}

class App {
  _workouts = [];
  _map;
  _mapEvent;

  constructor() {

    this._getPosition();

    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleField.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
          this._loadMap.bind(this),

          function () {
            alert('вы не предоставили доступ к своей локации')
          });
  }

  _loadMap(position) {
    const {latitude, longitude} = position.coords;
    const coords = [latitude, longitude]

    this._map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this._map);

    this._map.on('click', this._showForm.bind(this));
    this._workouts.forEach(work => {
      this._renderWorkoutMarker(work)});
  }

  _showForm(mapE) {
    this._mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(evt) {
    evt.preventDefault();
    const validInputs = (...inputs) => inputs.every(input => Number.isFinite(input));
    const allPositive = (...inputs) => inputs.every(input => input > 0);

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const {lat, lng} = this._mapEvent.latlng;
    let workout;
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (!validInputs(distance, duration, cadence) ||
          !allPositive(distance, duration, cadence)) {
        return alert('необходимо ввести целое положительное число')
      }
      workout = new Running([lat, lng], distance, duration, cadence);

    }
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (!validInputs(distance, duration, elevation) ||
          !allPositive(distance, duration)) {
        return alert('необходимо ввести целое положительное число')
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    this._workouts.push(workout);

    this._renderWorkoutMarker(workout);

    this._renderWorkout(workout)

    this._hideForm();
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords, {opacity: 0.8})
        .addTo(this._map)
        .bindPopup(L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: 'mark-popup'
        }))
        .setPopupContent(`${workout.type === 'running'? '🏃‍♂️':'🚴‍♀' } ${workout.description}`)
        .openPopup();
  }

  _hideForm() {
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
    form.classList.add('hidden')
  }

  _renderWorkout(workout) {
    let html = `
           <li class="workout workout--${workout.type}" data-id=${workout.id}>
          <h2 class="workout__title">${workout.description}</h2><div class="workout__details">
            <span class="workout__icon">${workout.type === 'running'? '🏃‍♂️':'🚴‍♀' }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">км</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">мин</span>
          </div>`;

    if (workout.type === 'running') {
      html+= `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">мин/км</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">шаг</span>
          </div>
        </li>`
    }

    if (workout.type === 'cycling') {
      html+= `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">км/час</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">м</span>
          </div>
        </li>`
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup (evt) {
    const workoutElement = evt.target.closest('.workout');
    if (!workoutElement) return;
    const workout = this._workouts.find(workout => workout.id === workoutElement.dataset.id);
    this._map.setView(workout.coords, 13, {animate:true, pan:{duration:1}});
  }

  _setLocalStorage () {
    localStorage.setItem('workouts', JSON.stringify(this._workouts))
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this._workouts = data;
    this._workouts.forEach(work => {
      this._renderWorkout(work);});
  }

  _reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();





