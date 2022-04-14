const LOWEST_MASS = 0.0001;
const HIGHEST_MASS = 0.001;
const LOWEST_AREA = 0.0001;
const HIGHEST_AREA = 0.01;

const SORT_ON = 'highestArea';

var socket = io.connect('http://10.112.10.93:3000');

const output = document.createElement('table');
output.style.color = 'white';
document.body.appendChild(output);
const heading = document.createElement('tr');
heading.id = 'headings'
output.appendChild(heading);

const idHeading = document.createElement('th');
heading.appendChild(idHeading);

const lowestAreaHeading = document.createElement('th');
lowestAreaHeading.innerText = `lowestArea (${LOWEST_AREA.toFixed(10)})`;
heading.appendChild(lowestAreaHeading);
const highestAreaHeading = document.createElement('th');
highestAreaHeading.innerText = `highestArea (${HIGHEST_AREA.toFixed(10)})`;
heading.appendChild(highestAreaHeading);
const lowestMassHeading = document.createElement('th');
lowestMassHeading.innerText = `lowestMass (${LOWEST_MASS.toFixed(10)})`;
heading.appendChild(lowestMassHeading);
const highestMassHeading = document.createElement('th');
highestMassHeading.innerText = `highestMass (${HIGHEST_MASS.toFixed(10)})`;
heading.appendChild(highestMassHeading);

let blobMap = {}
const handleBlobs = blobs => blobs.map(({ uid, mass, area }) => {
	if (!uid) {
		return;
	}
	if (!blobMap[uid]) {
		const el = document.createElement('tr');
		el.id = uid;
		output.appendChild(el);

		const uidEl = document.createElement('td');
		uidEl.name = 'uid';
		el.appendChild(uidEl);

		const lowestArea = document.createElement('td');
		lowestArea.name = 'lowestArea';
		el.appendChild(lowestArea);
		const highestArea = document.createElement('td');
		highestArea.name = 'highestArea';
		el.appendChild(highestArea);
		const lowestMass = document.createElement('td');
		lowestMass.name = 'lowestMass';
		el.appendChild(lowestMass);
		const highestMass = document.createElement('td');
		highestMass.name = 'highestMass';
		el.appendChild(highestMass);
	}

	blobMap[uid] = {
		uid,
		lowestArea: blobMap[uid]?.lowestArea > area ? area : blobMap[uid]?.lowestArea ?? area,
		highestArea: blobMap[uid]?.highestArea < area ? area : blobMap[uid]?.highestArea ?? area,
		lowestMass: blobMap[uid]?.lowestMass > mass ? mass : blobMap[uid]?.lowestMass ?? mass,
		highestMass: blobMap[uid]?.highestMass < mass ? mass : blobMap[uid]?.highestMass ?? mass,
	}
});

setInterval(() => {
	const blobArray = Object.values(blobMap).sort((a, b) => a[SORT_ON] - b[SORT_ON]);

	output.children.forEach((row, i) => {
		if (row.id === 'headings') {
			return;
		}
		const children = [...row.children];

		if (!blobArray[i]) {
			return;
		}
		const uid = children.find(({ name }) => name === 'uid');
		uid.innerText = blobArray[i].uid;

		const lowestArea = children.find(({ name }) => name === 'lowestArea');
		lowestArea.innerText = blobArray[i].lowestArea;
		lowestArea.style.color = blobArray[i].lowestArea <= LOWEST_AREA ? 'red' : 'white'

		const highestArea = children.find(({ name }) => name === 'highestArea');
		highestArea.innerText = blobArray[i].highestArea;
		highestArea.style.color = blobArray[i].highestArea >= HIGHEST_AREA ? 'red' : 'white'

		const lowestMass = children.find(({ name }) => name === 'lowestMass');
		lowestMass.innerText = blobArray[i].lowestMass;
		lowestMass.style.color = blobArray[i].lowestMass <= LOWEST_MASS ? 'red' : 'white'

		const highestMass = children.find(({ name }) => name === 'highestMass');
		highestMass.innerText = blobArray[i].highestMass;
		highestMass.style.color = blobArray[i].highestMass >= HIGHEST_MASS ? 'red' : 'white'

	})
}, 500);

socket.on('debug', handleBlobs);
socket.on('debugX', x => {
	console.log(x)

});
