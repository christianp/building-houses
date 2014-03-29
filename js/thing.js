var field;
var plots;
var houses;
var failed;
var last_house;

// formatter to round figures to 3 decimal places
var posformatter = d3.format('.3f');

// format a number as an ordinal
function ordinal(n) {
	switch(n%10) {
	case 1:
		return n+'st';
	case 2:
		return n+'nd';
	case 3:
		return n+'rd';
	default:
		return n+'th';
	}
}

// Update the plots display
function updatePlots() {

	// work out how wide a plot is
	var plotWidth = 1/plots.length;

	// count how many houses are in each plot
	var sorted_houses = houses.slice().sort();
	plots = plots.map(function(){return 0})
	sorted_houses.map(function(x) {
		var plot = Math.floor(x*plots.length);
		if(plot>plots.length-1)
			plot -= 1;
		plots[plot] += 1;
	});

	// create the displays for each plot
	var plot = field.select('.plots').selectAll('.plot')
				.data(plots);

	plot.enter()
					.append('g')
					.attr('class','plot')
					.append('rect');
	;
	// size and position all the plots
	plot
		.attr('transform',function(d,i) {
			return "translate("+(((904-plots.length*4)*plotWidth+4)*i+20)+",30)";
		})
	;
	plot.select('rect')
		.attr('width',function(d,i){return (904-plots.length*4)*plotWidth})
		.attr('height',50);
	;

	// classify plots based on how many houses they have in thema
	plot
		.classed('empty',function(d) { return d==0 })
		.classed('occupied',function(d) {return d==1 })
		.classed('crowded',function(d) {return d>1 })
	;

	plot.exit().remove();

	// create the displays for each house
	var house = field.select('.houses').selectAll('.house')
				.data(sorted_houses)

	house.enter()
		.append('g')
			.attr('class','house')
			.append('circle')
				.attr('r',5);
	;

	// position each house
	house
		.attr('transform',function(d) {
				return 'translate('+(d*900+20)+',55)';
		})

	house.exit().remove();

	// show the positions of the placed houses in a list
	var house_list = d3.select('.house-list ul').selectAll('li')
						.data(houses);

	house_list.enter()
				.append('li')
				.text(function(d){return posformatter(d)});
	;
	d3.select('.house-list')
		.style('display',houses.length ? 'inherit' : 'none')
	;

	house_list.exit().remove();

}

// add a plot, then recalculate the display
function addPlot() {
	plots.push(plots.length+1);
	updatePlots();
};

// is the current setup valid? If any plot has more than one house, then no
function isValid() {
	for(var i=0;i<plots.length;i++) {
		if(plots[i]>1)
			return false;
	}
	return true;
}

// add a house from the text input
function addTextHouse() {
	var input = $('#text-input input');
	var x = parseFloat(input.val());
	if(x>=0 && x<=1) {
		addHouse(x);
	}
	input.val('');
	$("#text-input input").focus(); // sets the focus back int the text box 
}

// add a house at position x
function addHouse(x) {

	// can't add houses when in the fail state, and check that x is in the interval [0,1]
	if(failed || x<0 || x>1)
		return;

	// add the house to the list, and recalculate the display
	houses.push(x);
	updatePlots();

	// are we now in a failed state?
	var fail = !isValid();
	if(fail) {
		// if so, remove the house we just added, and move the failed house marker to its position.
		var last_house_x = houses.pop();
		last_house
			.classed('show',true)
			.attr('transform','translate('+(last_house_x*900+20)+',55)')
		;
	}
	// update everything on the page to reflect the fail state
	setFail(fail);

	//if we failed, remove a plot so we can show the last working solution
	if(failed) {
		plots = plots.slice(0,houses.length);
		updatePlots();
	}
	else {
		// if we didn't fail, add another plot for the next step, and check whether the situation is hopeless (two houses in the same plot, no matter where the next one goes)
		addPlot();
		updatePlots();
		updateHopelessWarning();
	}
}

// update the page to reflect whether we're in the fail state
function setFail(fail) {
	$('#hopeless-warning').hide();
	failed = fail;
	$('#fail').toggle(failed);
	if(failed) {
		$('#score').text(houses.length);
		$('#house-pluralise').text(houses.length==1 ? 'house' : 'houses');
		$('#last-house').text(ordinal(houses.length+1));
	}
	else {
		last_house
			.classed('show',false)
		;
	}
}

function updateHopelessWarning() {
	// the situation is hopeless if any plot has more than one house in it
	var hopeless = d3.max(plots)>1;
	$('#hopeless-warning').toggle(hopeless);
}

// when the user clicks on the "see last working solution" button
function seeLastWorkingSolution() {
	// get rid of a plot
	plots.pop();
	// recalculate the display
	updatePlots();
	// we're now in the fail state
	setFail(true);
}

// undo the last move
function undo() {
	// if we're in the fail state, we just need to say we're not in the fail state any more
	if(failed) {
		setFail(false);
	}
	// if we're fine, just remove the last placed house
	else {
		houses.pop();
	}

	// make sure we have the right number of plots
	plots = plots.slice(0,houses.length+1);
	while(plots.length<houses.length+1)
		plots.push(0);

	// recalculate the display
	updatePlots();
	updateHopelessWarning();
}

// reset the game
function reset() {
	plots = [1];
	houses = [];
	updatePlots();
	setFail(false);
}

$(document).ready(function() {
	// create the field
	field = d3.select('.field');

	field
		.attr('width',940)
		.attr('height',90)
	;
	field.append('g').attr('class','plots');
	field.append('g').attr('class','houses');

	// create the new house marker
	var new_house = field.append('g')
					.attr('class','new-house')
					.classed('show',false)
	;
	new_house.append('line')
			.attr('x1','0')
			.attr('y1','-45')
			.attr('y2','25')
			.attr('x2','0')
	new_house.append('circle')
					.attr('r',5)
	;
	var new_house_pos = new_house.append('text')
						.attr('transform','translate(0,-10)')
	;

	// create the last (failed) house marker
	last_house = field.append('g')
						.attr('class','last-house')
						.classed('show',false)
	;
	last_house.append('path')
				.attr('d','M-5,-5L5,5M5,-5L-5,5')
	;

	// when you click on the field, place a house there
	field.on('mousedown',function() {
		if(d3.event.button!=0)
			return;
		var x = d3.mouse(this)[0]-20;
		addHouse(x/900);
	});

	// the new house marker follows the mouse
	field.on('mousemove',function() {
		if(failed)
			return;
		var x = d3.mouse(this)[0] - 20;
		new_house.classed('show',x>=0 && x<900)
				.attr('transform','translate('+(x+20)+',55)')
		;
		new_house_pos.text(posformatter(x/900));
	})
	field.on('mouseout',function() {
		new_house.classed('show',false);
	});

	// create the scale
	var xScale = d3.scale.linear().domain([0,1]).range([0,900]);
	var axis = d3.svg.axis()
				.scale(xScale)
				.ticks(10,'.1f')
				.orient('top')
	;
	var axis_minor = d3.svg.axis()
				.scale(xScale)
				.ticks(100)
				.tickSize(5)
				.tickFormat('')
				.orient('top')
	;


	var axis_g = field.append('g')
					.attr('transform','translate(20,25)')
					.attr('class','axis')
	;
	axis_g.append('g').call(axis);
	axis_g.append('g').attr('class','axis-minor').call(axis_minor);

	// set button click events
	$('button#undo').on('click',undo);
	$('button#reset').on('click',reset);
	$('#text-input').on('submit',function(e) {
		e.preventDefault();
		addTextHouse();
	});
	$('#see-why').on('click',seeLastWorkingSolution);

	// start the game
	reset();
});
